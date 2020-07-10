import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import { CosmosClient } from '@azure/cosmos'
import Web3 from 'web3'
import { User, reader, writer } from './db'

const responseCreator = (context: Context) => (
	status = 200,
	body: string | Record<string, unknown> = ''
) => {
	context.res = {
		status,
		body,
	}
}

export const httpTrigger: AzureFunction = async function (
	context: Context,
	req: HttpRequest
): Promise<void> {
	const resp = responseCreator(context)
	const { method } = req
	const { id, network } = req.params
	const { name = '', signature = '', message = '' } =
		method === 'POST' ? req.body : {}

	const net = network === 'main' || network === 'mainnet' ? 'mainnet' : network

	if (method === 'POST') {
		if (name === '' || signature === '' || message === '') {
			return resp(400)
		}

		const web3 = new Web3()
		const account = web3.eth.accounts.recover(message, signature)

		context.log(`net: ${net}, account: ${account}, id: ${id}`)

		if (account !== id) {
			return resp(400)
		}
	}

	// update address name or get address name
	const result = await (method === 'POST'
		? writer(CosmosClient)({ id, addressName: name })
		: reader(CosmosClient)(id))

	context.log(`result: ${result.resource?.addressName}, ${result.resource?.id}`)

	return resp(200, result.resource as User)
}
