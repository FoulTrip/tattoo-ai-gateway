export interface ExternalBackendResponse {
  status: string;
  message: string;
  body_image: {
    filename: string;
    resolution: string;
    format: string;
    size_bytes: number;
    content_type: string;
  };
  tattoo_image: {
    filename: string;
    resolution: string;
    format: string;
    size_bytes: number;
    content_type: string;
  };
  storage: {
    input_bucket: string;
    output_bucket: string;
    body_upload_status: string;
    tattoo_upload_status: string;
  };
  queue: {
    task_queued: boolean;
    queue_name: string;
    expected_output: string;
  };
  [key: string]: any;
}