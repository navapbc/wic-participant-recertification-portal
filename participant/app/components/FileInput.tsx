import {
  Button,
  Card,
  CardBody,
  CardGroup,
  FormGroup,
  Icon,
  Label,
} from "@trussworks/react-uswds";
import { FilePreview } from "app/components/FilePreview";
import { FileInputControl } from "~/components/FileInputControl";
import React, { useState, useRef, useEffect } from "react";
import type {
  ReactElement,
  MouseEventHandler,
  DragEventHandler,
  HTMLInputTypeAttribute,
} from "react";
import { i18nKey } from "~/types";
import { useTranslation } from "react-i18next";

export type FileInputProps = {
  className?: string;
  type?: HTMLInputTypeAttribute;
  draggable?: boolean;
  id: string;
  labelKey: i18nKey;
  accept?: string;
  multiple?: boolean;
  required?: boolean;
  maxFileSizeInBytes?: number;
  getFiles?: (e: Function) => void;
};

export type FileState = {
  [key: string]: File;
};

export const FileInput = (props: FileInputProps): ReactElement => {
  const { labelKey, maxFileSizeInBytes = 52_428_800, ...rest } = props;
  const { t } = useTranslation();
  const [files, setFiles] = useState({} as FileState);
  const [previews, setPreviews] = useState(<></>);
  const fileInputField = useRef(null);
  const convertBytesToKB = (bytes: number) => Math.round(bytes / 1000);

  const renderPreviews = () => {
    setPreviews(
      <>
        {Object.keys(files).map((fileName, index) => {
          let file = files[fileName];
          return (
            <>
              <span className="text-lg margin-bottom-1">
                Document {index + 1}
              </span>
              <FilePreview
                imageId={`preview-${index}`}
                file={file}
                clickHandler={removeFile}
              />
            </>
          );
        })}
      </>
    );
  };
  useEffect(renderPreviews, [files]);
  const addNewFiles = (newFiles: FileList) => {
    for (let file of newFiles) {
      if (file.size <= maxFileSizeInBytes) {
        files[file.name] = file;
      }
    }
    return { ...files };
  };
  const handleNewFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { files: newFiles } = e.target;
    if (newFiles?.length) {
      let updatedFiles = addNewFiles(newFiles);
      setFiles(updatedFiles);
    }
  };
  const removeFile = (fileName: string) => {
    delete files[fileName];
    setFiles({ ...files });
  };
  return (
    <FormGroup>
      {previews}
      <Label htmlFor="file-input-async">
        <>
          Document {Object.keys(files).length + 1}{" "}
          {Object.keys(files).length > 0 ? "(if needed)" : ""}
        </>
      </Label>
      <FileInputControl
        ref={fileInputField}
        id="file-input-async"
        multiple
        name="file-input-async"
        onChange={handleNewFileUpload}
        onDrop={function noRefCheck() {}}
        value=""
        title=""
        draggable={true}
      />
    </FormGroup>
  );
};
