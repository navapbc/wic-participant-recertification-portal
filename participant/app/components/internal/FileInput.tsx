/* Heavily edited from @trussworks/react-uswds FileInput component */
/* Added:
 *  * Internationalization
 *  * Noscript behavior
 * Removed:
 *  * FilePreview components (now controlled by FileUploader)
 */
import React, {
  useState,
  forwardRef,
  useEffect,
  useRef,
  useImperativeHandle,
} from "react";
import classnames from "classnames";
import type { i18nKey } from "~/types";
import { useTranslation } from "react-i18next";
import { Label } from "@trussworks/react-uswds";

export type FileInputProps = {
  id: string;
  name: string;
  disabled?: boolean;
  multiple?: boolean;
  accept?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDrop?: (e: React.DragEvent) => void;
  emptyKey: i18nKey;
  notEmptyKey: i18nKey;
  emptyAriaKey: i18nKey;
  notEmptyAriaKey: i18nKey;
  fileTypeErrorKey: i18nKey;
  empty?: boolean;
};

export type FileInputRef = {
  input: HTMLInputElement | null;
  files: File[];
};

export const FileInputForwardRef: React.ForwardRefRenderFunction<
  FileInputRef,
  FileInputProps & JSX.IntrinsicElements["input"]
> = (
  {
    name,
    id,
    disabled,
    multiple,
    className,
    accept,
    onChange,
    onDrop,
    emptyKey,
    notEmptyKey,
    emptyAriaKey,
    notEmptyAriaKey,
    fileTypeErrorKey,
    empty = true,
    ...inputProps
  },
  ref
): React.ReactElement => {
  const internalRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showError, setShowError] = useState(false);
  const [javascriptDisabled, setjavascriptDisabled] = useState(true);
  const [files, setFiles] = useState<File[]>([]);
  const { t } = useTranslation();
  const helpText = empty ? t(emptyKey) : t(notEmptyKey);
  const ariaHelpText = empty ? t(emptyAriaKey) : t(notEmptyAriaKey);
  useImperativeHandle(
    ref,
    () => ({
      input: internalRef.current,
      clearFiles: (): void => setFiles([]),
      files,
    }),
    [files]
  );

  useEffect(() => {
    setjavascriptDisabled(false);
  }, []);
  const fileInputClasses = classnames(
    {
      "usa-file-input": !javascriptDisabled,
      "usa-file-input--disabled": disabled,
    },
    className
  );

  const targetClasses = classnames(
    "usa-file-input__target",
    {
      "usa-file-input--drag": isDragging,
      "has-invalid-file": showError,
    },
    "border-dashed",
    "border-blue",
    "border-05"
  );

  const instructionClasses = classnames("usa-file-input__instructions");

  const preventInvalidFiles = (e: React.DragEvent): void => {
    setShowError(false);

    if (accept) {
      const acceptedTypes = accept.split(",");
      let allFilesAllowed = true;
      for (let i = 0; i < e.dataTransfer.files.length; i += 1) {
        const file = e.dataTransfer.files[parseInt(`${i}`)];
        if (allFilesAllowed) {
          for (let j = 0; j < acceptedTypes.length; j += 1) {
            const fileType = acceptedTypes[parseInt(`${j}`)];
            allFilesAllowed =
              file.name.indexOf(fileType) > 0 ||
              file.type.includes(fileType.replace(/\*/g, ""));
            if (allFilesAllowed) break;
          }
        } else break;
      }

      if (!allFilesAllowed) {
        setFiles([]);
        setShowError(true);
        e.preventDefault();
        e.stopPropagation();
      }
    }
  };

  // Event handlers
  const handleDragOver = (): void => setIsDragging(true);
  const handleDragLeave = (): void => setIsDragging(false);
  const handleDrop = (e: React.DragEvent): void => {
    preventInvalidFiles(e);
    setIsDragging(false);
    if (onDrop) onDrop(e);
  };
  const inputBoxClass = classnames({
    "usa-file-input__box": !javascriptDisabled,
  });
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setShowError(false);

    // Map input FileList to array of Files
    const fileArr = [];
    if (e.target?.files?.length) {
      const fileLength = e.target?.files?.length || 0;

      for (let i = 0; i < fileLength; i++) {
        const file = e.target.files.item(i);
        if (file) fileArr.push(file);
      }
    }
    setFiles(fileArr);

    if (onChange) onChange(e);
  };

  return (
    <div
      data-testid="file-input"
      className={fileInputClasses}
      aria-disabled={disabled}
    >
      <div
        data-testid="file-input-droptarget"
        className={targetClasses}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        hidden={javascriptDisabled}
      >
        <Label
          data-testid="file-input-instructions"
          className={instructionClasses}
          id="file-input-instructions"
          aria-label={ariaHelpText}
          htmlFor={id}
        >
          <span
            className="usa-file-input__choose text-bold"
            hidden={javascriptDisabled}
          >
            {helpText}
          </span>
        </Label>
        <div data-testid="file-input-box" className={inputBoxClass}></div>
        {showError && (
          <div
            data-testid="file-input-error"
            className="usa-file-input__accepted-files-message"
          >
            {t(fileTypeErrorKey)}
          </div>
        )}
        <input
          {...inputProps}
          ref={internalRef}
          type="file"
          data-testid="file-input-input"
          name={name}
          id={id}
          className="usa-file-input__input"
          disabled={disabled}
          onChange={handleChange}
          accept={accept}
          multiple={multiple || javascriptDisabled}
        />
      </div>
    </div>
  );
};

export const FileInput = forwardRef(FileInputForwardRef);
