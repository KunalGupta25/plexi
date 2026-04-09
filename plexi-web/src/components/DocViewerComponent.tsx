import React from "react";
import DocViewer, { DocViewerRenderers } from "@cyntler/react-doc-viewer";
import "@cyntler/react-doc-viewer/dist/index.css";

interface DocViewerComponentProps {
  document: string;
  filename: string;
}

const DocViewerComponent: React.FC<DocViewerComponentProps> = ({
  document,
  filename,
}) => {
  const docs = [
    {
      uri: document,
      fileName: filename,
    },
  ];

  return (
    <div className="w-full h-full min-h-0 lg:min-h-[600px] flex flex-col relative bg-white overflow-hidden">
      <DocViewer
        documents={docs}
        pluginRenderers={DocViewerRenderers}
        style={{ width: "100%", height: "100%", minHeight: "0" }}
        config={{
          header: {
            disableHeader: true,
            disableFileName: true,
            retainURLParams: false,
          },
        }}
      />
    </div>
  );
};

export default DocViewerComponent;
