import { AzureFunction, Context, HttpRequest } from '@azure/functions'
import Web3 from 'web3'

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
	const { query } = req
	const { name, signature, network } = query

	if (name === null || signature === null || network === null) {
		return resp(400)
	}

	const net = network === 'main' || network === 'mainnet' ? 'mainnet' : network
	const web3 = new Web3(
		new Web3.providers.HttpProvider(
			`https://${net}.infura.io/v3/${process.env.INFURA_IO_PROJECT}`
		)
	)

	context.log(`net: ${net}, web3: ${web3}`)

	return resp(200, 'OK')
}

export default httpTrigger
