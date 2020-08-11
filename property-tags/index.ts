/* eslint-disable functional/no-conditional-statement */
/* eslint-disable functional/no-expression-statement  */
import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { CosmosClient, ItemResponse } from '@azure/cosmos'
import Web3 from 'web3'
import {
	PropertyTags,
	countAllPropertiesByTag,
	reader,
	writer,
} from '../db/property-tags'
import { deleteTag, writer as tagWriter } from '../db/tag'
import { responseCreator } from '../utils'

const updateTags = async (
	oldTags: readonly string[],
	newTags: readonly string[]
): Promise<void> => {
	// update tags
	await Promise.all(
		newTags.map(async (tag: string) => {
			return tagWriter(CosmosClient)({ id: tag })
		})
	)

	// delete not related tags
	await Promise.all(
		oldTags.map(async (tag: string) => {
			return await countAllPropertiesByTag(CosmosClient)(tag).then((count) => {
				if (count === 0) {
					return deleteTag(CosmosClient)(tag)
				}
			})
		})
	)
}

export const httpTrigger: AzureFunction = async function (
	context: Context,
	req: HttpRequest
): Promise<void> {
	const resp = responseCreator(context)
	const { method } = req
	const { id } = req.params
	const { tags = '', account = '', signature = '', message = '' } =
		method === 'POST' ? req.body : {}

	// auth
	if (method === 'POST') {
		if (account === '' || signature === '' || message === '') {
			return resp(400)
		}

		const web3 = new Web3()
		const recoverAccount = web3.eth.accounts.recover(message, signature)

		if (recoverAccount !== account) {
			return resp(400)
		}
	}

	const data = async (method: string | null): Promise<PropertyTags> => {
		const result = await reader(CosmosClient)(id)
		const readTags = result.resource as PropertyTags

		if (method === 'POST') {
			const splitedTags = tags.split(' ').filter((t: string) => t !== '')
			const result = await writer(CosmosClient)({ id, tags: splitedTags }).then(
				(r: ItemResponse<PropertyTags>) => {
					// eslint-disable-next-line functional/functional-parameters
					return updateTags(readTags?.tags, splitedTags).then(() => {
						return r
					})
				}
			)
			return result.resource as PropertyTags
		} else {
			return readTags
		}
	}

	return resp(200, ((await data(method)) || {}) as PropertyTags)
}
