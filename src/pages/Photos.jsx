import React, { useEffect, useState } from "react";
import { PageTitle, Icon } from "../components/ConsoleUI.jsx";
import useCamera, { captureFrame, resizeImageFile } from "../components/useCamera.js";
import PhotoThumb from "../components/PhotoThumb.jsx";
import { useStore, savePhoto, deletePhoto, sendReport } from "../backend/api.js";
import { bodyParts } from "../lib.js";

const CATEGORIES = {
  face: { label: "Face (fluid shift)", facing: "user", tip: "Face the camera straight on, same spot and light each week. Fit your face inside the oval." },
  skin: { label: "Skin (rash, cold sore, wound)", facing: "environment", tip: "Hold the camera 15–20 cm away, in good light. Include something for scale if you can." },
  eyes: { label: "Eyes (redness, swelling)", facing: "user", tip: "Look straight at the camera with both eyes open, in even light." },
  other: { label: "Other", facing: "environment", tip: "Anything you want the CMO or flight surgeon to see." },
};
const PUFFINESS = ["None", "Mild", "Moderate", "Severe"];

export default function Photos({ person, go, params }) {
  const state = useStore();
  const pid = person.id;
  const cam = useCamera();
  const [category, setCategory] = useState(params.category || "face");
  const [part, setPart] = useState("immune");
  const [note, setNote] = useState("");
  const [rating, setRating] = useState(0);
  const [pending, setPending] = useState(null); // captured blob waiting to be saved
  const [pendingUrl, setPendingUrl] = useState(null);
  const [msg, setMsg] = useState("");
  const [compare, setCompare] = useState([]);
  const [filter, setFilter] = useState("all");
  const photos = state.photos[pid].filter((p) => filter === "all" || p.category === filter);
  useEffect(() => () => { if (pendingUrl) URL.revokeObjectURL(pendingUrl); }, [pendingUrl]);

  function hold(blob) {
    setPending(blob);
    setPendingUrl(URL.createObjectURL(blob));
    setMsg("");
  }

  async function snap() {
    const blob = await captureFrame(cam.videoRef.current);
    cam.stop();
    if (blob) hold(blob);
  }

  async function upload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try { hold(await resizeImageFile(file)); }
    catch { setMsg("Could not open this image. Try another photo."); }
    e.target.value = "";
  }

  async function save() {
    await savePhoto(pid, pending, { category, part: category === "skin" ? part : category === "face" ? "heart" : category === "eyes" ? "eyes" : null, note, rating: category === "face" ? rating : null });
    URL.revokeObjectURL(pendingUrl);
    setPending(null);
    setPendingUrl(null);
    setNote("");
    setMsg("Photo saved to your log.");
  }

  function toggleCompare(id) {
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c.slice(-1), id]));
  }

  const faces = state.photos[pid].filter((p) => p.category === "face");
  const firstVsLatest = faces.length >= 2 ? [faces[faces.length - 1].id, faces[0].id] : null;
  const shown = compare.length === 2 ? compare : null;
  const meta = (id) => state.photos[pid].find((p) => p.id === id);

  return (
    <div className="photo-workspace">
      <PageTitle eyebrow="Body · Photo log" title="Notice the small changes" description="Photos stay on this device. Compare them over time, or attach them to a simulated report." />

      <div className="card">
        <div className="row">
          <select aria-label="Photo category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
          </select>
          {category === "skin" && (
            <select aria-label="Body area" value={part} onChange={(e) => setPart(e.target.value)}>
              {Object.entries(bodyParts).map(([k, p]) => <option key={k} value={k}>{p.name}</option>)}
            </select>
          )}
        </div>
        <p className="small muted">{CATEGORIES[category].tip}</p>
        <div className="cam-box">
          <video ref={cam.videoRef} playsInline muted className={cam.active ? "" : "hidden"} />
          {cam.active && category === "face" && <div className="oval" />}
          {!cam.active && pendingUrl && <img src={pendingUrl} alt="Captured" />}
          {!cam.active && !pendingUrl && <div className="cam-placeholder"><Icon name="camera" size={42} />Camera off · Capture or upload a photo</div>}
        </div>
        {cam.error && <p className="error">{cam.error}</p>}
        <div className="row">
          {!cam.active && <button className="btn" onClick={() => cam.start(CATEGORIES[category].facing)}><Icon name="camera" />Open camera</button>}
          {cam.active && <button className="btn primary" onClick={snap}>Take photo</button>}
          {cam.active && <button className="btn small" onClick={cam.stop}>Close camera</button>}
          <label className="btn upload-photo-button"><Icon name="download" />Upload photo<input aria-label="Upload medical photo" type="file" accept="image/*" onChange={upload} /></label>
        </div>
        {pending && (
          <>
            {category === "face" && (
              <div className="row">
                <span>Puffiness:</span>
                {PUFFINESS.map((p, i) => (
                  <label key={p} className="radio"><input type="radio" checked={rating === i} onChange={() => setRating(i)} /> {p}</label>
                ))}
              </div>
            )}
            <input placeholder="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
            <div className="row">
              <button className="btn primary" onClick={save}>Save photo</button>
              <button className="btn" onClick={() => { setPending(null); setPendingUrl(null); }}>Discard</button>
            </div>
          </>
        )}
        {msg && <p className="muted">{msg}</p>}
      </div>

      <div className="row spread">
        <h3>Your photos ({state.photos[pid].length})</h3>
        <select aria-label="Filter photos" value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All</option>
          {Object.entries(CATEGORIES).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
        </select>
      </div>
      {photos.length === 0 && <p className="muted">No photos yet.</p>}
      <p className="small muted">Tap two photos to compare them side by side.</p>
      <div className="gallery">
        {photos.map((p) => (
          <div key={p.id} className="gallery-item">
            <PhotoThumb id={p.id} selected={compare.includes(p.id)} onClick={() => toggleCompare(p.id)} />
            <div className="small">Day {p.day} · {CATEGORIES[p.category].label.split(" (")[0]}{p.rating != null ? ` · ${PUFFINESS[p.rating]}` : ""}</div>
            {p.note && <div className="small muted">{p.note}</div>}
            <div className="row">
              <button className="btn small" onClick={() => { sendReport(pid, "message", `Photo: ${CATEGORIES[p.category].label}${p.note ? ` – ${p.note}` : ""}`, [p.id]); setMsg("Photo queued to Earth. Track it in Earth link."); }}>Send to Earth</button>
              <button className="btn small" onClick={() => deletePhoto(pid, p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {(shown || firstVsLatest) && (
        <div className="card">
          <h3>{shown ? "Comparison" : "Face: first vs latest"}</h3>
          <div className="compare">
            {(shown || firstVsLatest).map((id) => (
              <div key={id}>
                <PhotoThumb id={id} size={240} />
                <div className="small">Day {meta(id)?.day}{meta(id)?.rating != null ? ` · ${PUFFINESS[meta(id).rating]}` : ""}</div>
              </div>
            ))}
          </div>
          {shown && <button className="btn small" onClick={() => setCompare([])}>Clear comparison</button>}
        </div>
      )}
      <button className="btn small" onClick={() => go("checks")}>Back to Checks</button>
    </div>
  );
}
