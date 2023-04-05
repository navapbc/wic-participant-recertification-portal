/* Lifted and edited from @trussworks/react-uswds FilePreview internal only component
 * This component (in the source) gets displayed as part of the @trussworks/react-uswds
 * FileInput component after a file (or files) are selected
 * Added:
 * * Localization strings for the text
 * * Button that triggers a callback (currently used as "Remove File")
 * * clickHandler for the callback
 * * Props definition
 * Changed:
 * * Replaced use of fileReaderRef with URL.createObjectURL
 * * Minor className changes for styling
 */
import React, { useEffect, useState } from "react";
import type { ReactElement } from "react";
import classNames from "classnames";
import type { i18nKey } from "~/types";
import { useTranslation } from "react-i18next";
/** Moving the SPACER_GIF definition here instead of the constants.ts file,
 * as webpack was exporting that entire file, including use of the File
 * WebAPI; this was causing server-side site generators to break (#1250). */

const SPACER_GIF =
  "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";

export type FilePreviewProps = {
  imageId: string;
  file: File;
  clickHandler: Function;
  removeFileKey: i18nKey;
  selectedKey: i18nKey;
  altTextKey: i18nKey;
};

export const FilePreview = (props: FilePreviewProps): ReactElement => {
  const {
    imageId,
    file,
    clickHandler,
    removeFileKey,
    selectedKey,
    altTextKey,
  } = props;

  const [isLoading, setIsLoading] = useState(true);
  const [previewSrc, setPreviewSrc] = useState(SPACER_GIF);
  const [showGenericPreview, setShowGenericPreview] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    const imgSrc = URL.createObjectURL(file);
    setIsLoading(false);
    setPreviewSrc(imgSrc);
  }, [file]);

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
  const altText = `${t(altTextKey)} ${name}`;
  return (
    <div className="margin-bottom-4 margin-top-2">
      <div className="usa-file-input">
        <div className="usa-file-input__target">
          <div className="usa-file-input__preview-heading">
            <div>{t(selectedKey)}</div>
            <button
              type="button"
              className="text-secondary-vivid usa-button--unstyled"
              onClick={() => clickHandler(name)}
            >
              {t(removeFileKey)}
            </button>
          </div>
          <div className="usa-file-input__preview" aria-hidden="true">
            <img
              id={imageId}
              src={previewSrc}
              alt={altText}
              className={imageClasses}
              onError={onImageError}
            />
            {name}
          </div>
          <div className="usa-file-input__box" />
        </div>
      </div>
    </div>
  );
};
