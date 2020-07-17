import test from 'ava'
import { stub } from 'sinon'
import { Context, HttpRequest } from '@azure/functions'
import Web3 from 'web3'
import { httpTrigger } from '.'
import * as db from './db'

stub(db, 'reader').callsFake(() => async (id: string) => {
	return {
		resource: {
			id,
			addressName: 'req-dummy-address-name',
		},
	} as any
})
stub(db, 'writer').callsFake(() => async (data: db.User) => {
	return {
		resource: data,
	} as any
})

const createContext = (): Context =>
	(({
		res: {},
		log: () => {
			// fake logger
		},
	} as unknown) as Context)
const createReq = (
	network?: string,
	id?: string,
	message?: string,
	addressName?: string,
	signature?: string,
	method = 'GET'
): HttpRequest =>
	(({
		method,
		params: {
			network,
			id,
		},
		body: {
			message,
			name: addressName,
			signature,
		},
	} as unknown) as HttpRequest)

const prepare = (): {
	readonly address: string
	readonly network: string
	readonly signature: string
	readonly message: string
} => {
	const web3 = new Web3()
	const account = web3.eth.accounts.create()
	const message = 'sign message'
	const { signature } = account.sign(message)
	const network = 'main'
	const address = account.address
	return {
		address,
		network,
		signature,
		message,
	}
}

test('get user data', async (t) => {
	const { network, address: id } = prepare()
	const context = createContext()

	await httpTrigger(context, createReq(network, id))

	t.deepEqual(context.res, {
		status: 200,
		body: {
			id: id,
			addressName: 'req-dummy-address-name',
		},
	})
})

test('post user data', async (t) => {
	const { network, address: id, signature, message } = prepare()
	const context = createContext()
	const method = 'POST'
	const addressName = 'new-address-name'

	await httpTrigger(
		context,
		createReq(network, id, message, addressName, signature, method)
	)

	t.deepEqual(context.res, {
		status: 200,
		body: {
			id,
			addressName,
		},
	})
})

test('invalid post request with invalid signature', async (t) => {
	const { network, address: id, message } = prepare()
	const context = createContext()
	const method = 'POST'
	const addressName = 'new-address-name'
	const invalidSignature =
		'0xde3857695618adfc20f598d59dc1fdfc820653e1affb2d16ccb5cf1821ead75a13d6b2cb50579bbec1d0a314ee417a356d6f3db389ce0a055e6badd03bbc50aaaa'

	await httpTrigger(
		context,
		createReq(network, id, message, addressName, invalidSignature, method)
	)

	t.deepEqual(context.res, {
		status: 400,
		body: '',
	})
})

test('invalid post request with empty request body', async (t) => {
	const { network, address: id, signature, message } = prepare()
	const context = createContext()
	const method = 'POST'
	const addressName = 'new-address-name'

	const testExec = async (
		message?: string,
		addressName?: string,
		signature?: string
	): Promise<void> => {
		await httpTrigger(
			context,
			createReq(network, id, message, addressName, signature, method)
		)

		t.deepEqual(context.res, {
			status: 400,
			body: '',
		})
	}

	const params = [
		{ addressName, signature },
		{ message, signature },
		{ addressName, message },
	]
	params.map((p) => testExec(p.message, p.addressName, p.signature))
})
