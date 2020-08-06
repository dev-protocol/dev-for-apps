/* eslint-disable functional/no-conditional-statement */
import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { CosmosClient } from '@azure/cosmos'
import { PropertyTags, reader, writer } from '../db/property-tags'
import { responseCreator } from '../utils'

export const httpTrigger: AzureFunction = async function (
	context: Context,
	req: HttpRequest
): Promise<void> {
	const resp = responseCreator(context)
	const { method } = req
	const { id } = req.params
	const { tags = '' } = method === 'POST' ? req.body : {}

	const data = async (method: string | null): Promise<PropertyTags> => {
		if (method === 'POST') {
			const splitedTags = tags.split(' ')
			const result = await writer(CosmosClient)({ id, tags: splitedTags })
			return result.resource as PropertyTags
		} else {
			const result = await reader(CosmosClient)(id)
			return result.resource as PropertyTags
		}
	}

	return resp(200, ((await data(method)) || {}) as PropertyTags)
}
