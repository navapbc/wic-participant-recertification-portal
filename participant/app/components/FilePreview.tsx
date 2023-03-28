import React, { MouseEventHandler, useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import classNames from "classnames";
import { Button } from "@trussworks/react-uswds";
/** Moving the SPACER_GIF definition here instead of the constants.ts file,
 * as webpack was exporting that entire file, including use of the File
 * WebAPI; this was causing server-side site generators to break (#1250). */

const SPACER_GIF =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export type FilePreviewProps = {
  imageId: string;
  file: File;
  clickHandler: Function;
};

export const FilePreview = (props: FilePreviewProps): ReactElement => {
  const { imageId, file, clickHandler } = props;
  const fileReaderRef = useRef<FileReader>(new FileReader());
  const [isLoading, setIsLoading] = useState(true);
  const [previewSrc, setPreviewSrc] = useState(SPACER_GIF);
  const [showGenericPreview, setShowGenericPreview] = useState(false);

  useEffect(() => {
    fileReaderRef.current.onloadend = (): void => {
      setIsLoading(false);
      setPreviewSrc(fileReaderRef.current.result as string);
    };

    fileReaderRef.current.readAsDataURL(file);

    return (): void => {
      fileReaderRef.current.onloadend = null;
    };
  }, []);

  const { name } = file;

  const onImageError = (): void => {
    setPreviewSrc(SPACER_GIF);
    setShowGenericPreview(true);
  };

  const isPDF = name.indexOf(".pdf") > 0;
  const isWord = name.indexOf(".doc") > 0 || name.indexOf(".pages") > 0;
  const isVideo = name.indexOf(".mov") > 0 || name.indexOf(".mp4") > 0;
  const isExcel = name.indexOf(".xls") > 0 || name.indexOf(".numbers") > 0;
  const isGeneric = !isPDF && !isWord && !isVideo && !isExcel;

  const imageClasses = classNames("usa-file-input__preview-image", {
    "is-loading": isLoading,
    "usa-file-input__preview-image--pdf": showGenericPreview && isPDF,
    "usa-file-input__preview-image--word": showGenericPreview && isWord,
    "usa-file-input__preview-image--video": showGenericPreview && isVideo,
    "usa-file-input__preview-image--excel": showGenericPreview && isExcel,
    "usa-file-input__preview-image--generic": showGenericPreview && isGeneric,
  });

  return (
    <div className="margin-bottom-4 margin-top-2">
      <div className="usa-file-input">
        <div className="usa-file-input__preview-heading border-bottom-width-0 border-width-1px border-dashed">
          <div>1 file selected</div>
          <Button
            type="button"
            unstyled
            className="usa-file-input__choose text-secondary-vivid z-top"
            onClick={() => clickHandler(name)}
          >
            Remove File
          </Button>
        </div>

        <div
          className="usa-file-input__preview border-dashed border-top-width-0 border-width-1px"
          aria-hidden="true"
        >
          <img
            id={imageId}
            data-testid="file-input-preview-image"
            src={previewSrc}
            alt=""
            className={imageClasses}
            onError={onImageError}
          />
          {name}
        </div>
      </div>
    </div>
  );
};
