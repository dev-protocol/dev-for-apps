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

const httpTrigger: AzureFunction = async function (
	context: Context,
	req: HttpRequest
): Promise<void> {
	const resp = responseCreator(context)
	const { method, query } = req
	const { name, signature, network } = query

	if (signature === undefined || network === undefined) {
		return resp(400)
	}

	if (method === 'POST' && name === undefined) {
		return resp(400)
	}

	const net = network === 'main' || network === 'mainnet' ? 'mainnet' : network
	const web3 = new Web3(
		new Web3.providers.HttpProvider(
			`https://${net}.infura.io/v3/${process.env.INFURA_IO_PROJECT}`
		)
	)

	const account = web3.eth.accounts.recover(
		'Please sign to confirm your address.',
		signature
	)

	context.log(`net: ${net}, account: ${account}`)

	// update address name or get address name
	const result = await (method === 'POST'
		? writer(CosmosClient)({ id: account, addressName: name })
		: reader(CosmosClient)(account))

	context.log(`result: ${result.resource?.addressName}, ${result.resource?.id}`)

	return resp(200, result.resource as User)
}

export default httpTrigger
