export const job_runs = {
  jobs: [
    {
      input_filename: 'build-analytical-table.ipynb',
      output_formats: ['ipynb'],
      job_definition_id: 'twb9e84r7o40',
      parameters: {},
      name: 'build-analytical-table',
      output_filename_template: '{{input_filename}}-{{create_time}}',
      job_id: 'vqsrh19klv8r',
      job_files: [],
      url: '/jobs/vqsrh19klv8r',
      create_time: 1711407205000,
      update_time: 1711407205000,
      start_time: 1711407205000,
      end_time: 1711407397000,
      status: 'FAILED',
      status_message:
        'Failed executing notebook file with error: \n---------------------------------------------------------------------------\nException encountered at "In [1]":\n  File "/tmp/ipykernel_43/1960736354.py", line 1\n    1 to 5\n      ^\nSyntaxError: invalid syntax\n\n',
      downloaded: false,
      runtimeProperties: {},
      externalLinks: [
        {
          label: 'Data Pipeline Run',
          description: 'Data Pipeline Run Url',
          url: 'https://example.com'
        }
      ],
      input_file_id: 'd4bfa40a-9b2c-4aa8-a5d1-e574b01ab996',
      output_file_id: 'd31b98f2-9a05-4fe3-bd4b-f18882d01dab',
      outputPreviewLink: 'https://example.com',
      showOutputInEmail: false,
      task_runs: [
        {
          input_filename: 'build-analytical-table.ipynb',
          output_formats: [],
          output_filename_template: '{{input_filename}}-{{create_time}}',
          job_id: 'vqsrh19klv8r',
          job_files: [
            {
              display_name: 'Input',
              file_format: 'input'
            }
          ],
          url: '/task_runs/vqsrh19klv8r',
          create_time: 1711407205000,
          update_time: 1711407205000,
          start_time: 1711407205000,
          end_time: 1711407397000,
          status: 'FAILED',
          status_message:
            'Failed executing notebook file with error: \n---------------------------------------------------------------------------\nException encountered at "In [1]":\n  File "/tmp/ipykernel_43/1960736354.py", line 1\n    1 to 5\n      ^\nSyntaxError: invalid syntax\n\n',
          downloaded: false,
          runId: 'vqsrh19klv8r',
          externalLinks: [
            {
              label: 'Data Pipeline Run',
              description: 'Data Pipeline Run Url',
              url: 'https://example.com'
            }
          ],
          input_file_id: 'd4bfa40a-9b2c-4aa8-a5d1-e574b01ab996',
          output_file_id: 'd31b98f2-9a05-4fe3-bd4b-f18882d01dab',
          outputPreviewLink: 'https://example.com',
          showOutputInEmail: false,
          run_count: 1,
          taskId: 'lellpmt5kw7i',
          dependsOn: []
        }
      ],
      tasks: [
        {
          id: 'lellpmt5kw7i',
          nodeId: 'lellpmt5kw7i',
          name: 'build-analytical-table',
          kernelSpecId: 'kipkdwls4p7h',
          namespaceId: '03n79u8lzwae',
          runtimeProperties: {},
          inputFiles: [
            {
              id: 'd4bfa40a-9b2c-4aa8-a5d1-e574b01ab996',
              name: 'build-analytical-table.ipynb'
            }
          ],
          showOutputInEmail: false,
          input_filename: 'build-analytical-table.ipynb',
          dependsOn: [],
          parameters: {},
          output_formats: ['ipynb'],
          create_time: '1711406900000',
          update_time: '1715820242000',
          status: 'UPDATED',
          input_file_id: 'd4bfa40a-9b2c-4aa8-a5d1-e574b01ab996',
          notebookParameters: {},
          notificationEmails: []
        }
      ],
      runId: 'scheduled__1976-04-01T00:00:00+00:00'
    }
  ],
  total_count: 1
} as const;
