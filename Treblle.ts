import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { ConfigContract } from '@ioc:Adonis/Core/Config'
import { inject } from '@adonisjs/core/build/standalone'
import os from 'os'
import { generateFieldsToMask, maskSensitiveValues, getRequestDuration } from '@treblle/utils'
import fetch from 'node-fetch'

@inject(['Adonis/Core/Config'])
export default class Treblle {
  constructor(private config: ConfigContract) {}
  public async handle({ request, response }: HttpContextContract, next: () => Promise<void>) {
    // TODO: Handle non-JSON response
    // code for middleware goes here. ABOVE THE NEXT CALL
    const requestStartTime = process.hrtime()
    const payload = request.all()
    const protocol = `${request.protocol()}/${request.request.httpVersion}`
    const fieldsToMask = generateFieldsToMask(this.config.get('treblle.additionalFieldsToMask'))
    const maskedRequestPayload = maskSensitiveValues(payload, fieldsToMask)
    let errors = []
    await next()
    response.response.on('finish', () => {
      const originalResponseBody = response.lazyBody[0]
      const maskedResponseBody = maskSensitiveValues(originalResponseBody, fieldsToMask)

      const trebllePayload = {
        api_key: this.config.get('treblle.apiKey'),
        project_id: this.config.get('treblle.projectId'),
        version: process.env.npm_package_version,
        sdk: 'adonisjs',
        data: {
          server: {
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            os: {
              name: os.platform(),
              release: os.release(),
              architecture: os.arch(),
            },
            software: null,
            signature: null,
            protocol,
          },
          language: {
            name: 'node',
            version: process.version,
          },
          request: {
            timestamp: new Date().toISOString().replace('T', ' ').substr(0, 19),
            ip: request.ip(),
            url: request.completeUrl(),
            user_agent: request.header('user-agent'),
            method: request.method(),
            headers: request.headers(),
            body: maskedRequestPayload,
          },
          response: {
            headers: response.getHeaders(),
            code: response.getStatus(),
            size: response.getHeader('Content-Length'),
            load_time: getRequestDuration(requestStartTime),
            body: maskedResponseBody ?? null,
          },
          errors,
        },
        showErrors: this.config.get('treblle.showErrors'),
      }
      console.log(JSON.stringify(trebllePayload, null, 2))

      fetch('https://rocknrolla.treblle.com', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.get('treblle.apiKey'),
        },
        body: JSON.stringify(trebllePayload),
      }).catch((error) => console.log(error))
    })
  }
}
