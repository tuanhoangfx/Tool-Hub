import type { RemoteFileState } from "../types";
import { MaterialIcon } from "./MaterialIcon";

type FileListBlockProps = {
  title: string;
  iconName: string;
  files: RemoteFileState[];
  empty?: string;
};

export function FileListBlock({ title, iconName, files, empty }: FileListBlockProps) {
  return (
    <section className="info-block compact">
      <h3>
        <MaterialIcon name={iconName} size={14} />
        {title}
      </h3>
      <div className="file-list">
        {files.length > 0 ? (
          files.map((file) => (
            <span className={file.ok ? "file-ok" : "file-missing"} key={file.path}>
              <MaterialIcon name={file.ok ? "check_circle" : "warning"} size={13} />
              {file.path}
              <em>{file.ok ? `${file.size}b` : file.error}</em>
            </span>
          ))
        ) : (
          <span className="file-missing">
            <MaterialIcon name="warning" size={13} />
            {empty ?? "—"}
          </span>
        )}
      </div>
    </section>
  );
}
