import "./UploadModal.scss";
import Modal from "../modal/Modal";
import { FiUpload } from "react-icons/fi";
import { useRef, useState } from "react";

export default function UploadModal({ open, onClose }) {
    const [name, setName] = useState("");
    const [category, setCategory] = useState("");

    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [uploading, setUploading] = useState<boolean>(false);

    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const fakeUpload = (file: File) => {
        setUploading(true);
        setUploadProgress(0);

        // fake upload progress animation
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setUploadProgress(progress);

            if (progress >= 100) {
                clearInterval(interval);

                // create preview
                const previewUrl = URL.createObjectURL(file);
                setImagePreview(previewUrl);

                setUploading(false);
            }
        }, 80);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setSelectedFile(file);
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        fakeUpload(file);
    };

    return (
        <Modal open={open} onClose={onClose} title="Add New Wardrobe Item">
            <div className="upload-form">

                {/* NAME */}
                <div className="form-field">
                    <label>Item Name</label>
                    <input
                        placeholder="Ex: Beige Trench Coat"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                    />
                </div>

                {/* CATEGORY */}
                <div className="form-field">
                    <label>Category</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                        <option value="">Select category</option>
                        <option value="tops">Tops</option>
                        <option value="layers">Layers</option>
                        <option value="shirts">Shirts</option>
                        <option value="pants">Pants</option>
                        <option value="shoes">Shoes</option>
                    </select>
                </div>

                {/* UPLOAD PHOTO */}
                <div className="form-field">
                    <label>Upload Photo</label>

                    {/* 1. IMAGE PREVIEW */}
                    {imagePreview && !uploading && (
                        <div className="image-preview">
                            <img src={imagePreview} alt="Preview" />
                        </div>
                    )}

                    {/* 2. PROGRESS BAR */}
                    {uploading && (
                        <div className="progress-wrapper">
                            <div
                                className="progress-bar"
                                style={{ width: `${uploadProgress}%` }}
                            ></div>
                            <span className="progress-text">{uploadProgress}%</span>
                        </div>
                    )}

                    {/* 3. UPLOAD DRAG-AREA (only when idle & no image yet) */}
                    {!imagePreview && !uploading && (
                        <div className="upload-area" onClick={handleUploadClick}>
                            <FiUpload className="upload-icon" />
                            <span className="upload-text">Click to upload or drag & drop</span>
                            <span className="upload-hint">PNG or JPG only</span>
                        </div>
                    )}

                    {/* hidden file input */}
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>

                {/* SAVE / CANCEL */}
                <div className="modal-actions">
                    <button className="cancel" onClick={() => {
                        onClose();
                        setSelectedFile(null);
                        setImagePreview(null);
                    }
                    }
                    >Cancel</button>
                    <button
                        className="save"
                        onClick={() => {
                            console.log("Saving item:", {
                                name,
                                category,
                                file: selectedFile
                            });
                            onClose();
                        }}
                    >
                        Save
                    </button>
                </div>

            </div>
        </Modal>
    );
}
