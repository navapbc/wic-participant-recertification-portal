import { FormGroup, Label } from "@trussworks/react-uswds";
import { FilePreview } from "app/components/FilePreview";
import { FileInput } from "app/components/internal/FileInput";
import { Trans, useTranslation } from "react-i18next";
import React, {
  useState,
  useRef,
  useImperativeHandle,
  useEffect,
  forwardRef,
} from "react";
import type { ReactElement } from "react";
import type { PreviousUpload, i18nKey } from "~/types";
import type { FileInputRef } from "app/components/internal/FileInput";

export type FileUploaderProps = {
  className?: string;
  id: string;
  name: string;
  labelKey: i18nKey;
  accept?: string;
  required?: boolean;
  maxFileSizeInBytes?: number;
  maxFileCount?: number;
  children?: ReactElement;
};

export type FileUploaderRef = {
  files: File[];
  removeFileList: (removeList: PreviousUpload[]) => void;
};

export type FileState = {
  [key: string]: File;
};

export type FileError = {
  errorType?: "count" | "size" | "type";
};

export const FileUploaderForwardRef: React.ForwardRefRenderFunction<
  FileUploaderRef,
  FileUploaderProps & JSX.IntrinsicElements["input"]
> = (
  {
    className,
    id,
    name,
    labelKey,
    accept,
    required,
    maxFileSizeInBytes = 26_214_400,
    maxFileCount = 20,
    children,
    ...inputProps
  },
  ref
): React.ReactElement => {
  const { t } = useTranslation();
  const [files, setFiles] = useState<FileState>({});
  const [previews, setPreviews] = useState(<></>);
  const fileInputRef = useRef<FileInputRef>(null);
  const documentString = t(`${labelKey}.document`);
  const [errorMessage, setErrorMessage] = useState("");

  const ifNeeded = t(`${labelKey}.ifNeeded`);
  const currentDocumentNumber = Object.keys(files).length;

  /* This allows us to add callable methods and values to a reference
   * passed in by the rendering page, instead of relying on a callback
   * passed in on the page to pass objects held in state (in this case, files)
   * out to the parent.
   * We're also adding a ref directly to the input component rendered here -
   * so if we need to manage its state or settings, that can be done.
   * For more, see: https://blog.webdevsimplified.com/2022-06/use-imperative-handle/
   */
  useImperativeHandle(
    ref,
    () => ({
      files: Object.keys(files).map((key) => files[key]),
      removeFileList: removeFileList,
    }),
    // eslint-disable-next-line   react-hooks/exhaustive-deps -- (deps list is correct)
    [files]
  );

  const renderPreviews = () => {
    setPreviews(
      <>
        {Object.keys(files).map((fileName, index) => {
          let file = files[fileName];
          return (
            <div
              key={`document-${index + 1}`}
              className={index == 0 ? "margin-top-2" : undefined}
            >
              <span>{`${documentString} ${index + 1}`}</span>
              <FilePreview
                imageId={`preview-${index}`}
                file={file}
                name={file.name}
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
  // eslint-disable-next-line   react-hooks/exhaustive-deps -- (deps list is correct)
  useEffect(renderPreviews, [files, documentString, labelKey]);
  const fileTypeCheck = (newFile: File): boolean => {
    if (!accept || accept == "*") {
      return true;
    }
    const acceptedTypes = accept.split(",");
    let fileTypeAllowed = true;
    for (let j = 0; j < acceptedTypes.length; j += 1) {
      const fileType = acceptedTypes[parseInt(`${j}`)];
      fileTypeAllowed =
        newFile.name.indexOf(fileType) > 0 ||
        newFile.type.includes(fileType.replace(/\*/g, ""));
      if (fileTypeAllowed) break;
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
  const removeFileList = (removeList: PreviousUpload[]) => {
    setErrorMessage("");
    setFiles({});
    for (let file of removeList) {
      delete files[file.name];
      setFiles({ ...files });
    }
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
      {children}
      {previews}
      <Label htmlFor={id}>{currentDocumentString}</Label>
      {errorMessage && (
        <div data-testid="file-input-error" className="file-input-error">
          <span className="display-block">
            <Trans i18nKey={errorMessage} />
          </span>
        </div>
      )}
      <FileInput
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
      <noscript>
        <Trans i18nKey={`${labelKey}.noScriptMessage`} />
      </noscript>
    </FormGroup>
  );
};

export const FileUploader = forwardRef(FileUploaderForwardRef);
