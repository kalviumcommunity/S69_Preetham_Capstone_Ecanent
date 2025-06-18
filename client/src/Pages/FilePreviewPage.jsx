

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import mammoth from "mammoth";

const docxStyles = `
  .docx-preview {
    font-family: Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    background-color: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .docx-preview h1 {
    font-size: 1.8rem;
    color: #1a73e8;
    margin-bottom: 0.5rem;
  }
  .docx-preview h2 {
    font-size: 1.5rem;
    color: #1a73e8;
    margin-bottom: 0.5rem;
  }
  .docx-preview p {
    margin-bottom: 1rem;
  }
  .docx-preview ul, .docx-preview ol {
    margin-bottom: 1rem;
    padding-left: 20px;
  }
  .docx-preview li {
    margin-bottom: 0.5rem;
  }
  .docx-preview table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 1rem;
  }
  .docx-preview th, .docx-preview td {
    border: 1px solid #ddd;
    padding: 8px;
    text-align: left;
  }
  .docx-preview th {
    background-color: #f5f5f5;
    font-weight: bold;
  }
  .docx-preview img {
    max-width: 100%;
    height: auto;
    margin: 1rem 0;
    border-radius: 4px;
  }
`;

function FilePreviewPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fileUrl = searchParams.get("fileUrl");
  const fileType = searchParams.get("fileType");
  const fileName = searchParams.get("fileName");

  const [docContent, setDocContent] = useState(null);
  const [error, setError] = useState(null);
  const [proxyUrl, setProxyUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const getFileType = (fileType) => {
    if (["image"].includes(fileType.toLowerCase())) return "image";
    if (["video"].includes(fileType.toLowerCase())) return "video";
    if (fileType.toLowerCase() === "pdf") return "pdf";
    if (["doc", "docx"].includes(fileType.toLowerCase())) return "doc";
    if (fileType.toLowerCase() === "txt") return "txt";
    return "other";
  };

  useEffect(() => {
    if (fileUrl) {
      const encodedUrl = encodeURIComponent(fileUrl);
      setProxyUrl(`${import.meta.env.VITE_BACKEND_URL}/api/files/proxy-file?url=${encodedUrl}`);
    }
  }, [fileUrl]);

  useEffect(() => {
    if (getFileType(fileType) === "doc" && proxyUrl) {
      setIsLoading(true);
      fetch(proxyUrl)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Failed to fetch DOC file: ${response.statusText}`);
          }
          return response.arrayBuffer();
        })
        .then((arrayBuffer) => {
          mammoth
            .convertToHtml({ arrayBuffer }, { includeDefaultStyleMap: true })
            .then((result) => {
              setDocContent(result.value);
            })
            .catch((error) => {
              console.error("Error converting DOC to HTML:", error);
              setDocContent(null);
              setError("Failed to load DOC file preview");
            });
        })
        .catch((error) => {
          console.error("Error fetching DOC file:", error);
          setError(`Failed to fetch DOC file: ${error.message}`);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [proxyUrl, fileType]);

  const downloadFile = () => {
    if (!proxyUrl) {
      setError("No file URL available for download");
      return;
    }
    fetch(proxyUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to download file: ${response.statusText}`);
        }
        return response.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || "downloaded-file";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
      })
      .catch((error) => {
        console.error("Error downloading file:", error);
        setError(`Failed to download file: ${error.message}`);
      });
  };

  if (!fileUrl || !fileType) {
    return <div className="p-4 text-red-500">Invalid file URL or type</div>;
  }

  return (
    <div className="min-h-screen p-4">
      <style>{docxStyles}</style>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">
          File Preview: {fileName || "Unknown File"}
        </h2>
        <button
          onClick={downloadFile}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition"
        >
          Download
        </button>
      </div>
      {error && <p className="text-red-500 mb-4">{error}</p>}
      {isLoading && (
        <p className="text-gray-600 mb-4 flex items-center">
          <svg
            className="animate-spin h-5 w-5 mr-2 text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          Loading file...
        </p>
      )}
      {getFileType(fileType) === "image" && proxyUrl && (
        <img
          src={proxyUrl}
          alt="File preview"
          className="max-w-full max-h-[80vh] rounded-md"
          onError={(e) => {
            console.error("Error loading image preview:", e);
            setError("Failed to load image");
          }}
        />
      )}
      {getFileType(fileType) === "video" && proxyUrl && (
        <video
          src={proxyUrl}
          controls
          className="max-w-full max-h-[80vh] rounded-md"
          onError={(e) => {
            console.error("Error loading video preview:", e);
            setError("Failed to load video");
          }}
        />
      )}
      {getFileType(fileType) === "pdf" && proxyUrl && (
        <div>
          <iframe
            src={proxyUrl}
            title="PDF Preview"
            className="w-full h-[90vh] border border-gray-300 rounded-md"
            onError={(e) => {
              console.error("Error loading PDF in iframe:", e);
              setError("Failed to load PDF in iframe");
            }}
          />
        </div>
      )}
      {getFileType(fileType) === "txt" && proxyUrl && (
        <div>
          <iframe
            src={proxyUrl}
            title="Text Preview"
            className="w-full h-[80vh] border border-gray-300 rounded-md"
            onError={(e) => {
              console.error("Error loading TXT in iframe:", e);
              setError("Failed to load TXT in iframe");
            }}
          />
        </div>
      )}
      {getFileType(fileType) === "doc" && docContent && (
        <div className="max-w-[800px] max-h-[88vh] overflow-auto border border-gray-300 rounded-md justify-self-center">
          <div className="docx-preview" dangerouslySetInnerHTML={{ __html: docContent }} />
        </div>
      )}
      {getFileType(fileType) === "doc" && !docContent && !error && !isLoading && (
        <div className="text-gray-600">Loading DOC file...</div>
      )}
      {getFileType(fileType) === "other" && (
        <div className="text-gray-600">
          Preview not available for this file type. Please download to view.
        </div>
      )}
    </div>
  );
}

export default FilePreviewPage;