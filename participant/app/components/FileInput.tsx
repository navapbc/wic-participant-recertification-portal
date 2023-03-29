import { FormGroup, Label } from "@trussworks/react-uswds";
import { FilePreview } from "app/components/internal/FilePreview";
import { FileInputControl } from "app/components/internal/FileInputControl";
import React, {
  useState,
  useRef,
  useImperativeHandle,
  useEffect,
  forwardRef,
} from "react";
import { i18nKey } from "~/types";
import { Trans, useTranslation } from "react-i18next";

export type FileInputProps = {
  className?: string;
  id: string;
  name: string;
  labelKey: i18nKey;
  accept?: string;
  required?: boolean;
  maxFileSizeInBytes?: number;
  maxFileCount?: number;
};

export type FileState = {
  [key: string]: File;
};

export type FileInputRef = {
  input: HTMLInputElement | null;
  files: File[];
};

export type FileError = {
  errorType?: "count" | "size" | "type";
};

export const FileInputForwardRef: React.ForwardRefRenderFunction<
  FileInputRef,
  FileInputProps & JSX.IntrinsicElements["input"]
> = (
  {
    className,
    id,
    name,
    labelKey,
    accept,
    required,
    maxFileSizeInBytes = 26_214_400,
    maxFileCount = 25,
    ...inputProps
  },
  ref
): React.ReactElement => {
  const { t } = useTranslation();
  const [files, setFiles] = useState({} as FileState);
  const [previews, setPreviews] = useState(<></>);
  const fileInputRef = useRef(null);
  const documentString = t(`${labelKey}.document`);
  const [errorMessage, setErrorMessage] = useState("");

  const ifNeeded = t(`${labelKey}.ifNeeded`);
  const currentDocumentNumber = Object.keys(files).length;

  useImperativeHandle(
    ref,
    () => ({
      input: fileInputRef.current,
      files: Object.keys(files).map((key) => files[key]),
    }),
    [files]
  );
  const makeSafeForID = (name: string): string => {
    return name.replace(/[^a-z0-9]/g, function replaceName(s) {
      const c = s.charCodeAt(0);
      if (c === 32) return "-";
      if (c >= 65 && c <= 90) return `img_${s.toLowerCase()}`;
      return `__${c.toString(16).slice(-4)}`;
    });
  };

  const renderPreviews = () => {
    setPreviews(
      <>
        {Object.keys(files).map((fileName, index) => {
          let file = files[fileName];
          const imageId = makeSafeForID(fileName);
          return (
            <div key={`document-${index + 1}`}>
              <span className="font-sans-lg">{`${documentString} ${
                index + 1
              }`}</span>
              <FilePreview
                imageId={`preview-${index}`}
                file={file}
                clickHandler={removeFile}
                removeFileKey={`${labelKey}.removeFile`}
                selectedKey={`${labelKey}.selected`}
                altTextKey={`${labelKey}.altText`}
              />
            </div>
          );
        })}
      </>
    );
  };
  useEffect(renderPreviews, [files]);
  const fileTypeCheck = (newFile: File): boolean => {
    if (!accept || accept == "*") {
      return true;
    }
    const acceptedTypes = accept.split(",");
    let fileTypeAllowed = true;
    if (fileTypeAllowed) {
      for (let j = 0; j < acceptedTypes.length; j += 1) {
        const fileType = acceptedTypes[parseInt(`${j}`)];
        fileTypeAllowed =
          newFile.name.indexOf(fileType) > 0 ||
          newFile.type.includes(fileType.replace(/\*/g, ""));
        if (fileTypeAllowed) break;
      }
    }
    return fileTypeAllowed;
  };
  const addNewFiles = (newFiles: FileList) => {
    setErrorMessage("");

    if (
      Object.keys(files).length + Object.keys(newFiles).length <=
      maxFileCount
    ) {
      for (let file of newFiles) {
        if (file.size <= maxFileSizeInBytes) {
          if (fileTypeCheck(file)) {
            files[file.name] = file;
          } else {
            setErrorMessage(`${labelKey}.fileTypeError`);
          }
        } else {
          setErrorMessage(`${labelKey}.fileSizeError`);
        }
      }
    } else {
      setErrorMessage(`${labelKey}.fileCountError`);
    }
    return { ...files };
  };
  const handleNewFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    const { files: newFiles } = e.target;
    if (newFiles?.length) {
      let updatedFiles = addNewFiles(newFiles);
      setFiles(updatedFiles);
    }
  };
  const removeFile = (fileName: string) => {
    setErrorMessage("");
    delete files[fileName];
    setFiles({ ...files });
  };

  const currentDocumentString =
    currentDocumentNumber > 0
      ? `${documentString} ${currentDocumentNumber + 1} ${ifNeeded}`
      : `${documentString} ${currentDocumentNumber + 1}`;
  return (
    <FormGroup>
      {previews}
      <Label htmlFor="file-input-async" className="font-sans-lg">
        {currentDocumentString}
      </Label>
      {errorMessage && (
        <div data-testid="file-input-error" className="file-input-error">
          <Trans i18nKey={errorMessage} />
        </div>
      )}
      <FileInputControl
        {...inputProps}
        ref={fileInputRef}
        id={id}
        name={name}
        accept={accept}
        onChange={handleNewFileUpload}
        onDrop={function noRefCheck() {}}
        value=""
        title=""
        draggable={true}
        emptyKey={`${labelKey}.noFiles`}
        notEmptyKey={`${labelKey}.additionalFiles`}
        fileTypeErrorKey={`${labelKey}.fileTypeError`}
        empty={currentDocumentNumber == 0}
      />
    </FormGroup>
  );
};

export const FileInput = forwardRef(FileInputForwardRef);
