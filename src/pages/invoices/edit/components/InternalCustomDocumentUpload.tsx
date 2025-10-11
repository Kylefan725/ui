import { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import styled from 'styled-components';
import { useTranslation } from 'react-i18next';
import { request } from '$app/common/helpers/request';
import { toast } from '$app/common/helpers/toast/toast';
import { ValidationBag } from '$app/common/interfaces/validation-bag';
import { AxiosError } from 'axios';
import { ErrorMessage } from '$app/components/ErrorMessage';
import { useColorScheme, useFullTheme } from '$app/common/colors';
import { CloudUpload } from '$app/components/icons/CloudUpload';

interface Props {
  endpoint: string;
  onSuccess?: () => unknown;
  disabled?: boolean;
  hasExisting?: boolean;
  isApproved?: boolean;
}

const Box = styled.div`
  border-color: ${(props) => props.theme.borderColor};
  &:hover {
    border-color: ${(props) => props.theme.hoverBorderColor};
  }
`;

export function InternalCustomDocumentUpload(props: Props) {
  const [t] = useTranslation();

  const colors = useColorScheme();
  const fullTheme = useFullTheme();

  const [errors, setErrors] = useState<ValidationBag | undefined>();
  const [clientError, setClientError] = useState<string | undefined>();
  const [uploadProgress, setUploadProgress] = useState<number>(0);

  const MAX_BYTES = 10 * 1024 * 1024; // 10MB

  const handleUpload = (file: File) => {
    setErrors(undefined);
    setClientError(undefined);

    if (!file) {
      return;
    }

    const isPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf');
    const isWithinSize = file.size <= MAX_BYTES;

    if (!isPdf) {
      setClientError('PDF only (max 10MB).');
      toast.error('wrong_file_extension');
      return;
    }

    if (!isWithinSize) {
      setClientError('PDF only (max 10MB).');
      // Fallback to generic error if specific key not present
      toast.error('error_title');
      return;
    }

    const formData = new FormData();
    formData.append('document', file);

    toast.processing();
    request('POST', props.endpoint, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (event) => {
        if (event.total) {
          const percent = Math.round((event.loaded * 100) / event.total);
          setUploadProgress(percent);
        }
      },
    })
      .then(() => {
        toast.success('uploaded_document');
        setUploadProgress(0);
        props.onSuccess?.();
      })
      .catch((error: AxiosError<ValidationBag>) => {
        setUploadProgress(0);
        if (error.response?.status === 422) {
          toast.dismiss();
          setErrors(error.response.data);
        }
      });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: MAX_BYTES,
    maxFiles: 1,
    multiple: false,
    disabled: props.disabled || props.isApproved,
    onDropAccepted: (acceptedFiles) => {
      if (acceptedFiles.length) {
        handleUpload(acceptedFiles[0]);
      }
    },
    onDropRejected: (fileRejections) => {
      setClientError('PDF only (max 10MB).');
      // Differentiate between type vs size rejection; fall back to generic error key for size
      const tooLarge = fileRejections?.some((r) =>
        r.errors?.some((e) => e.code === 'file-too-large')
      );
      toast.error(tooLarge ? 'error_title' : 'wrong_file_extension');
    },
  });

  return (
    <div className="w-full">
      <div className="text-sm mb-2">
        {props.hasExisting ? (
          <span>
            {t('upload')}: PDF only, max 10MB. Uploading again will replace the
            existing custom document.
          </span>
        ) : (
          <span>{t('upload')}: PDF only, max 10MB.</span>
        )}
      </div>

      <div
        {...getRootProps()}
        className="flex flex-col md:flex-row md:items-center"
      >
        <Box
          className="relative block w-full border-2 border-dashed rounded-lg p-12 text-center cursor-pointer"
          theme={{
            ...fullTheme,
            borderColor: colors.$21,
            hoverBorderColor: colors.$17,
          }}
        >
          <input {...getInputProps()} />

          <div className="flex justify-center">
            <CloudUpload size="2.3rem" color={colors.$3} />
          </div>

          <span
            className="mt-2 block text-sm font-medium"
            style={{ color: colors.$3, colorScheme: colors.$0 }}
          >
            {isDragActive ? t('drop_file_here') : t('dropzone_default_message')}
          </span>
        </Box>
      </div>

      <div className="text-sm mt-2 text-gray-500 dark:text-gray-400">
        {t('internal_invoice_summary_required_with_upload')}
      </div>

      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700 mt-4">
          <div
            className="bg-blue-600 h-2.5 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          ></div>
          <div className="text-sm text-gray-500 mt-1">
            {Math.round(uploadProgress)}%
          </div>
        </div>
      )}

      {clientError && (
        <ErrorMessage className="mt-2">{clientError}</ErrorMessage>
      )}

      {errors &&
        Object.keys(errors.errors).map((key, index) => (
          <ErrorMessage key={index} className="mt-2">
            {errors.errors[key]}
          </ErrorMessage>
        ))}
    </div>
  );
}

export default InternalCustomDocumentUpload;
