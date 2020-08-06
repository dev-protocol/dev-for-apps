/* eslint-disable functional/no-conditional-statement */
import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { CosmosClient } from '@azure/cosmos'
import { PropertyTags, getAllPropertiesByTag } from '../db/property-tags'
import { responseCreator } from '../utils'

export const httpTrigger: AzureFunction = async function (
	context: Context,
	req: HttpRequest
): Promise<void> {
	const resp = responseCreator(context)
	const { method } = req

	if (method !== 'POST') {
		return resp(400)
	}

	const { tags = '' } = req.body

	if (tags === '') {
		return resp(400)
	}

	// get search word
	// NOTE: Currently, you can only specify one search tag name
	const tag = tags.split(' ')[0]

	// check only blank
	if (tag === '') {
		return resp(400)
	}

	const results = await getAllPropertiesByTag(CosmosClient)(tag)

	return resp(200, { result: results.resources as readonly PropertyTags[] })
}
