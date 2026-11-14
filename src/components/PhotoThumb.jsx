import React, { useEffect, useState } from "react";
import { getPhoto } from "../backend/photoStore.js";

// Loads a photo from IndexedDB and shows it
export default function PhotoThumb({ id, size = 120, onClick, selected }) {
  const [url, setUrl] = useState(null);
  useEffect(() => {
    let objectUrl = null;
    let alive = true;
    getPhoto(id).then((blob) => {
      if (blob && alive) {
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      }
    });
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id]);
  return (
    <div className={"thumb" + (selected ? " selected" : "")} style={{ width: size, height: size }} onClick={onClick}>
      {url ? <img src={url} alt="Health log photo" /> : <span className="muted small">Loading…</span>}
    </div>
  );
}
