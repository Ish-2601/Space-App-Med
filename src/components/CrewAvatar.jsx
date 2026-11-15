import React, { useEffect, useRef, useState } from "react";
import { useStore, saveProfilePhoto, deleteProfilePhoto } from "../backend/api.js";
import { getPhoto } from "../backend/photoStore.js";
import { prepareProfilePhoto } from "../backend/profilePhoto.js";

export default function CrewAvatar({ person, onSelect, editable = false, compact = false }) {
  const state = useStore();
  const photoId = state.profilePhotos?.[person.id];
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const input = useRef(null);

  useEffect(() => {
    let alive = true;
    let objectUrl;
    setPhoto(null);
    if (photoId) {
      getPhoto(photoId).then((blob) => {
        if (!blob || !alive) return;
        objectUrl = URL.createObjectURL(blob);
        setPhoto({ id: photoId, url: objectUrl });
      });
    }
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoId]);

  async function upload(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setSaving(true);
    try {
      await saveProfilePhoto(person.id, await prepareProfilePhoto(file));
    } catch (e) {
      setError(e.message || "Could not save this photo. Please try another image.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setSaving(true);
    setError("");
    try {
      await deleteProfilePhoto(person.id);
    } catch {
      setError("Could not remove this photo. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const portrait = photo?.id === photoId && photo
    ? <img src={photo.url} alt={`${person.name}'s profile`} />
    : <span className="avatar-initials" aria-hidden="true">{person.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</span>;

  return (
    <div className={`crew-avatar-group${compact ? " crew-avatar-group--compact" : ""}`}>
      <div className="crew-avatar-wrap">
        {onSelect ? (
          <button className="crew-avatar" onClick={onSelect} aria-label={`Open ${person.name}'s health dashboard`}>{portrait}</button>
        ) : <div className="crew-avatar">{portrait}</div>}
        {editable && <>
          <button className="crew-photo-button" onClick={() => input.current.click()} disabled={saving} aria-label={`Change ${person.name}'s profile photo`} title="Upload a profile photo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M8 5l1.5-2h5L16 5h3a2 2 0 0 1 2 2v12H3V7a2 2 0 0 1 2-2Z" strokeLinejoin="round" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          </button>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={upload} aria-label={`Upload a profile photo for ${person.name}`} disabled={saving} />
        </>}
      </div>
      {editable && <div className="crew-photo-feedback">
        {saving ? <span role="status">Saving photo…</span> : photoId ? <button className="crew-photo-remove" onClick={remove}>Remove photo</button> : null}
        {error && <span className="error" role="alert">{error}</span>}
      </div>}
    </div>
  );
}
