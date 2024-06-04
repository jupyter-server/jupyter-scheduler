export const job_definitions = {
  job_definitions: [
    {
      input_filename: 'build-ml-feature-table.ipynb',
      output_formats: ['html', 'ipynb'],
      parameters: {},
      name: 'workflow-demo',
      output_filename_template: '{{input_filename}}-{{create_time}}',
      schedule: '@once',
      timezone: 'UTC',
      job_definition_id: '6wjmuwtydym3',
      create_time: 1712183119000,
      update_time: 1715981514000,
      active: true,
      id: '6wjmuwtydym3',
      kernelSpecId: 'python3',
      namespaceId: '03n79u8lzwae',
      notificationEmails: ['sathishlxg@gmail.com'],
      showOutputInEmail: false,
      status: 'DEPLOYED',
      input_file_id: '13d90071-eff8-4d8a-aaf2-1f6e56fcd870',
      externalLinks: [
        {
          label: 'Data Pipeline Url',
          description: 'Data Pipeline Url',
          url: 'https://example.com'
        },
        {
          label: 'Pipeline Runs',
          description: 'Pipeline Runs Url',
          url: 'https://example.com'
        }
      ],
      tasks: [
        {
          id: '8hdqvd6tsp1r',
          nodeId: 'LNjurr1oRFI9EL1AsJ3Bo',
          name: 'build-ml-feature-table',
          kernelSpecId: 'python3',
          namespaceId: '03n79u8lzwae',
          inputFiles: [
            {
              id: '13d90071-eff8-4d8a-aaf2-1f6e56fcd870',
              name: 'build-ml-feature-table.ipynb'
            }
          ],
          showOutputInEmail: false,
          input_filename: 'build-ml-feature-table.ipynb',
          dependsOn: ['r3p1b7tf5ofo'],
          output_formats: ['html', 'ipynb'],
          create_time: '1715981365000',
          update_time: '1715981365000',
          status: 'CREATED',
          status_message: '',
          input_file_id: '13d90071-eff8-4d8a-aaf2-1f6e56fcd870',
          notificationEmails: []
        },
        {
          id: 'd7q7duwockyg',
          nodeId: 'tLNsAJmnqjNHOiL4rTQIT',
          name: 'error_file',
          kernelSpecId: 'python3',
          namespaceId: '03n79u8lzwae',
          inputFiles: [
            {
              id: '4161515a-9cad-4400-952a-5cef471cd455',
              name: 'error_file.ipynb'
            }
          ],
          showOutputInEmail: false,
          input_filename: 'error_file.ipynb',
          dependsOn: ['r3p1b7tf5ofo'],
          output_formats: ['html', 'ipynb'],
          create_time: '1715981362000',
          update_time: '1715981362000',
          status: 'CREATED',
          status_message: '',
          input_file_id: '4161515a-9cad-4400-952a-5cef471cd455',
          notificationEmails: []
        },
        {
          id: 'o7lc09auhxmw',
          nodeId: 'CRlKpv0NIBEKQZGGXXbAF',
          name: 'visualize',
          kernelSpecId: 'python3',
          namespaceId: '03n79u8lzwae',
          runtimeProperties: {},
          inputFiles: [
            {
              id: 'ad1ec69c-8acc-4d13-8e46-8a1671298690',
              name: 'visualize.ipynb'
            }
          ],
          taskTimeout: '14400',
          showOutputInEmail: false,
          input_filename: 'visualize.ipynb',
          dependsOn: ['8hdqvd6tsp1r', 'd7q7duwockyg'],
          parameters: {},
          output_formats: ['html', 'ipynb'],
          create_time: '1712183119000',
          update_time: '1712183119000',
          status: 'CREATED',
          status_message: '',
          input_file_id: 'ad1ec69c-8acc-4d13-8e46-8a1671298690',
          notebookParameters: {},
          notificationEmails: []
        },
        {
          id: 'r3p1b7tf5ofo',
          nodeId: 'Y0rlnnkoYTO9R9VcwOMtA',
          name: 'Untitled1',
          kernelSpecId: 'python3',
          namespaceId: '03n79u8lzwae',
          inputFiles: [
            {
              id: '316b09eb-96ea-4d44-8b96-644692b85d52',
              name: 'Untitled1.ipynb'
            }
          ],
          showOutputInEmail: false,
          input_filename: 'Untitled1.ipynb',
          dependsOn: [],
          output_formats: ['html', 'ipynb'],
          create_time: '1715981361000',
          update_time: '1715981361000',
          status: 'CREATED',
          status_message: '',
          input_file_id: '316b09eb-96ea-4d44-8b96-644692b85d52',
          notificationEmails: []
        }
      ],
      version: 'v2',
      notebookParameters: {},
      deploy_time: 1715981918000
    },
    {
      input_filename: 'build-ml-feature-table.ipynb',
      output_formats: ['html', 'ipynb'],
      parameters: {},
      name: 'feature-engineering-demo',
      output_filename_template: '{{input_filename}}-{{create_time}}',
      schedule: '@once',
      timezone: 'UTC',
      job_definition_id: 'v546iot33iy6',
      create_time: 1712179842000,
      update_time: 1712179842000,
      active: true,
      id: 'v546iot33iy6',
      kernelSpecId: 'python3',
      namespaceId: '03n79u8lzwae',
      notificationEmails: ['sathishlxg@gmail.com'],
      showOutputInEmail: false,
      status: 'UPDATED',
      input_file_id: 'b377f40c-4b86-463d-bdd2-1c40f2d944ba',
      tasks: [
        {
          id: 'soahmnenunyq',
          nodeId: 'oIluDdpWnMKiGJYNiS46z',
          name: 'build-ml-feature-table',
          kernelSpecId: 'python3',
          namespaceId: '03n79u8lzwae',
          inputFiles: [
            {
              id: 'b377f40c-4b86-463d-bdd2-1c40f2d944ba',
              name: 'build-ml-feature-table.ipynb'
            }
          ],
          showOutputInEmail: false,
          input_filename: 'build-ml-feature-table.ipynb',
          dependsOn: [],
          output_formats: ['html', 'ipynb'],
          create_time: '1712179858000',
          update_time: '1712179858000',
          status: 'CREATED',
          status_message: '',
          input_file_id: 'b377f40c-4b86-463d-bdd2-1c40f2d944ba',
          notificationEmails: []
        },
        {
          id: 'h7ney54y3mkh',
          nodeId: 'F5iCoL_lVojn0lVtaGktL',
          name: 'visualize',
          kernelSpecId: 'python3',
          namespaceId: '03n79u8lzwae',
          inputFiles: [
            {
              id: '83bef0a3-72e7-4ca8-82db-804b70963d46',
              name: 'visualize.ipynb'
            }
          ],
          showOutputInEmail: false,
          input_filename: 'visualize.ipynb',
          dependsOn: [],
          output_formats: ['html', 'ipynb'],
          create_time: '1712179897000',
          update_time: '1712179897000',
          status: 'FAILED_TO_CREATE',
          status_message:
            'Unexpected Http Response status=500, httpClient=Secrets Service, errorMessage=A server error occurred: there was an error managing secretsConfiguration: ohsdz0b133l8 and the secretsConfiguration was true reverted from the Meta Store, cause: javax.ws.rs.InternalServerErrorException: Communication with Whisper Service failed, errorMessage=received Http Error response code 500, message=Failed to get all secrets in a bucket, exception=Communication with Secret Service failed, errorMessage=received 5xx internal server error, responseBody={"code":500,"message":"HTTP 500 Internal Server Error"} -- javax.ws.rs.InternalServerErrorException: Communication with Secret Service failed, errorMessage=received Http Error response code 500, message=Failed to get all secrets, exception=Communication with Whisper Service failed, errorMessage=received 5xx internal server error, responseBody={"code":500,"message":"HTTP 500 Internal Server Error"}',
          input_file_id: '83bef0a3-72e7-4ca8-82db-804b70963d46',
          notificationEmails: []
        },
        {
          id: 'u8rnhq3qutkz',
          nodeId: 'LsoPU1_fHnGs7tTTyPd0f',
          name: 'error_file',
          kernelSpecId: 'python3',
          namespaceId: '03n79u8lzwae',
          inputFiles: [
            {
              id: '8541a53d-ba3c-4912-bd47-1a0eadd14b20',
              name: 'error_file.ipynb'
            }
          ],
          showOutputInEmail: false,
          input_filename: 'error_file.ipynb',
          dependsOn: [],
          output_formats: ['html', 'ipynb'],
          create_time: '1712179859000',
          update_time: '1712179859000',
          status: 'CREATED',
          status_message: '',
          input_file_id: '8541a53d-ba3c-4912-bd47-1a0eadd14b20',
          notificationEmails: []
        },
        {
          id: 'rixbiknu5kr4',
          nodeId: 'IJfFkF_qjSckWrwi2nCvc',
          name: 'transform-raw-data',
          kernelSpecId: 'python3',
          namespaceId: '03n79u8lzwae',
          inputFiles: [
            {
              id: '86f20000-31a9-4750-826c-8ef98b4dc23c',
              name: 'transform-raw-data.ipynb'
            }
          ],
          showOutputInEmail: false,
          input_filename: 'transform-raw-data.ipynb',
          dependsOn: [],
          output_formats: ['html', 'ipynb'],
          create_time: '1712179852000',
          update_time: '1712179852000',
          status: 'FAILED_TO_CREATE',
          status_message:
            'Unexpected Http Response status=500, httpClient=Secrets Service, errorMessage=A server error occurred: there was an error managing secretsConfiguration: c33jkwa5t8x9 and the secretsConfiguration was true reverted from the Meta Store, cause: javax.ws.rs.InternalServerErrorException: Communication with Secret Service failed, errorMessage=received Http Error response code 500, message=Failed to get all secrets in a bucket, exception=Communication with Whisper Service failed, errorMessage=received 5xx internal server error, responseBody={"code":500,"message":"HTTP 500 Internal Server Error"} -- javax.ws.rs.InternalServerErrorException: Communication with Whisper Service failed, errorMessage=received Http Error response code 500, message=Failed to get all secrets, exception=Communication with Whisper Service failed, errorMessage=received 5xx internal server error, responseBody={"code":500,"message":"HTTP 500 Internal Server Error"}',
          input_file_id: '86f20000-31a9-4750-826c-8ef98b4dc23c',
          notificationEmails: []
        }
      ],
      version: 'v2',
      notebookParameters: {}
    }
  ],
  total_count: 23
} as const;
