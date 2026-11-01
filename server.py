import sqlite3
import os
import secrets
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

DB_PATH = os.path.join(os.path.dirname(__file__), "linktree.db")
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

ADMIN_SECRET = "mylinktree2024"


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            url TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS profile (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            name TEXT NOT NULL DEFAULT 'Your Name',
            bio TEXT NOT NULL DEFAULT 'Your bio goes here',
            icon_url TEXT DEFAULT NULL
        );
    """)
    cur = conn.execute("SELECT COUNT(*) FROM profile")
    if cur.fetchone()[0] == 0:
        conn.execute("INSERT INTO profile (id, name, bio) VALUES (1, 'Your Name', 'Your bio goes here')")
    conn.commit()
    conn.close()


init_db()


def check_admin(req):
    token = req.headers.get("X-Admin-Token", "")
    return token == ADMIN_SECRET


# --- Public endpoints ---

@app.route("/api/links", methods=["GET"])
def get_links():
    conn = get_db()
    rows = conn.execute("SELECT id, title, url FROM links ORDER BY position ASC, id ASC").fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])


@app.route("/api/profile", methods=["GET"])
def get_profile():
    conn = get_db()
    row = conn.execute("SELECT name, bio, icon_url FROM profile WHERE id = 1").fetchone()
    conn.close()
    if row:
        return jsonify(dict(row))
    return jsonify({"name": "Your Name", "bio": "", "icon_url": None})


@app.route("/uploads/<path:filename>")
def serve_upload(filename):
    return send_from_directory(UPLOAD_DIR, filename)


# --- Admin endpoints ---

@app.route("/api/admin/links", methods=["POST"])
def add_link():
    if not check_admin(request):
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    title = data.get("title", "").strip()
    url = data.get("url", "").strip()
    if not title or not url:
        return jsonify({"error": "Title and URL required"}), 400
    if not url.startswith(("http://", "https://")):
        url = "https://" + url
    conn = get_db()
    max_pos = conn.execute("SELECT COALESCE(MAX(position), 0) FROM links").fetchone()[0]
    conn.execute("INSERT INTO links (title, url, position) VALUES (?, ?, ?)", (title, url, max_pos + 1))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/admin/links/<int:link_id>", methods=["DELETE"])
def delete_link(link_id):
    if not check_admin(request):
        return jsonify({"error": "Unauthorized"}), 401
    conn = get_db()
    conn.execute("DELETE FROM links WHERE id = ?", (link_id,))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/admin/links/reorder", methods=["PUT"])
def reorder_links():
    if not check_admin(request):
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    order = data.get("order", [])
    conn = get_db()
    for i, link_id in enumerate(order):
        conn.execute("UPDATE links SET position = ? WHERE id = ?", (i, link_id))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/admin/profile", methods=["PUT"])
def update_profile():
    if not check_admin(request):
        return jsonify({"error": "Unauthorized"}), 401
    data = request.json
    name = data.get("name", "").strip()
    bio = data.get("bio", "").strip()
    conn = get_db()
    conn.execute("UPDATE profile SET name = ?, bio = ? WHERE id = 1", (name, bio))
    conn.commit()
    conn.close()
    return jsonify({"success": True})


@app.route("/api/admin/icon", methods=["POST"])
def upload_icon():
    if not check_admin(request):
        return jsonify({"error": "Unauthorized"}), 401
    if "icon" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["icon"]
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in (".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"):
        return jsonify({"error": "Invalid file type"}), 400
    filename = f"icon_{secrets.token_hex(8)}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    file.save(filepath)
    icon_url = f"/uploads/{filename}"
    conn = get_db()
    conn.execute("UPDATE profile SET icon_url = ? WHERE id = 1", (icon_url,))
    conn.commit()
    conn.close()
    return jsonify({"success": True, "icon_url": icon_url})


@app.route("/api/admin/verify", methods=["GET"])
def verify_admin():
    if not check_admin(request):
        return jsonify({"valid": False}), 401
    return jsonify({"valid": True})


if __name__ == "__main__":
    app.run(debug=True, port=5000)
