import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'
import type { ConfigContract } from '@ioc:Adonis/Core/Config'
import { inject } from '@adonisjs/core/build/standalone'

import {
  sendPayloadToTreblle,
  generateFieldsToMask,
  maskSensitiveValues,
  getRequestDuration,
  generateTrebllePayload,
  getResponsePayload,
} from '@treblle/utils'

@inject(['Adonis/Core/Config'])
export default class Treblle {
  constructor(private config: ConfigContract) {}
  public async handle({ request, response }: HttpContextContract, next: () => Promise<void>) {
    const requestStartTime = process.hrtime()
    const payload = request.all()
    const protocol = `${request.protocol()}/${request.request.httpVersion}`
    const fieldsToMask = generateFieldsToMask(this.config.get('treblle.additionalFieldsToMask'))
    const maskedRequestPayload = maskSensitiveValues(payload, fieldsToMask)
    let errors = []
    response.response.on('finish', () => {
      const { payload: maskedResponseBody, error: invalidResponseBodyError } = getResponsePayload(
        response.lazyBody[0],
        fieldsToMask
      )

      if (invalidResponseBodyError) {
        // @ts-ignore
        errors.push(invalidResponseBodyError)
      }

      const trebllePayload = generateTrebllePayload(
        {
          api_key: this.config.get('treblle.apiKey'),
          project_id: this.config.get('treblle.projectId'),
          version: process.env.npm_package_version,
          sdk: 'adonisjs',
        },
        {
          server: {
            protocol,
          },
          request: {
            ip: request.ip(),
            url: request.completeUrl(),
            user_agent: request.header('user-agent'),
            method: request.method(),
            headers: maskSensitiveValues(request.headers(), fieldsToMask),
            body: maskedRequestPayload,
          },
          response: {
            headers: maskSensitiveValues(response.getHeaders(), fieldsToMask),
            code: response.getStatus(),
            size: response.getHeader('Content-Length'),
            load_time: getRequestDuration(requestStartTime),
            body: maskedResponseBody ?? null,
          },
          errors,
        }
      )
      try {
        sendPayloadToTreblle(trebllePayload, this.config.get('treblle.apiKey'))
      } catch (error) {
        console.log(error)
      }
    })
    await next()
  }
}
