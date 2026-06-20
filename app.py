import os
import time
import requests
import xml.etree.ElementTree as ET
from flask import Flask, render_template, jsonify

app = Flask(__name__)

# Cache for the release notes to prevent excessive external requests
FEED_URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"
cache = {
    "data": None,
    "last_fetched": 0
}
CACHE_DURATION = 60 # Cache for 60 seconds

def fetch_and_parse_feed():
    now = time.time()
    if cache["data"] is not None and (now - cache["last_fetched"]) < CACHE_DURATION:
        return cache["data"]

    try:
        response = requests.get(FEED_URL, timeout=10)
        response.raise_for_status()
    except Exception as e:
        # If fetch fails, return cached data if available, else raise
        if cache["data"] is not None:
            return cache["data"]
        raise Exception(f"Failed to fetch feed: {str(e)}")

    try:
        root = ET.fromstring(response.content)
        # Atom feed namespace
        ns = {'atom': 'http://www.w3.org/2005/Atom'}
        
        entries = []
        # Find all entry elements
        for entry_elem in root.findall('atom:entry', ns):
            title_elem = entry_elem.find('atom:title', ns)
            id_elem = entry_elem.find('atom:id', ns)
            updated_elem = entry_elem.find('atom:updated', ns)
            content_elem = entry_elem.find('atom:content', ns)
            
            title = title_elem.text if title_elem is not None else "Unknown Date"
            entry_id = id_elem.text if id_elem is not None else ""
            updated = updated_elem.text if updated_elem is not None else ""
            content = content_elem.text if content_elem is not None else ""
            
            entries.append({
                "id": entry_id,
                "title": title,
                "updated": updated,
                "content": content
            })
            
        cache["data"] = entries
        cache["last_fetched"] = now
        return entries
    except Exception as e:
        if cache["data"] is not None:
            return cache["data"]
        raise Exception(f"Failed to parse feed XML: {str(e)}")

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    try:
        releases = fetch_and_parse_feed()
        return jsonify({
            "status": "success",
            "count": len(releases),
            "last_fetched": time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(cache["last_fetched"])),
            "releases": releases
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

if __name__ == '__main__':
    # Run server locally on port 5000
    app.run(debug=True, host='127.0.0.1', port=5000)
