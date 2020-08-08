/* eslint-disable functional/no-conditional-statement */
import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { CosmosClient } from '@azure/cosmos'
import { Tag, getTagsByWordWithForwardMatch } from '../db/tag'
import { responseCreator } from '../utils'

export const httpTrigger: AzureFunction = async function (
	context: Context,
	req: HttpRequest
): Promise<void> {
	const resp = responseCreator(context)
	const { w: searchWord } = req.query

	const result = await getTagsByWordWithForwardMatch(CosmosClient)(searchWord)

	return resp(200, { result: result.resources as readonly Tag[] })
}
