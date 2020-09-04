import test from 'ava'
import { stub } from 'sinon'
import { Context, HttpRequest } from '@azure/functions'
import Web3 from 'web3'
import { httpTrigger } from '.'
import * as db from '../db/property-tags'
import * as tagDB from '../db/tag'

const fakeStore: ReadonlyMap<string, readonly string[] | undefined> = new Map()

stub(db, 'reader').callsFake(() => async (id: string) => {
	return {
		resource: {
			id,
			tags: fakeStore.get(id),
		},
	} as any
})
stub(db, 'writer').callsFake(() => async (data: db.PropertyTags) => {
	return {
		resource: data,
	} as any
})
stub(db, 'countAllPropertiesByTag').callsFake(() => async () => {
	return 1
})
stub(tagDB, 'writer').callsFake(() => async (data: tagDB.Tag) => {
	return {
		resources: data,
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
	propertyAddress?: string,
	accountAddress?: string,
	message?: string,
	signature?: string,
	tags?: string,
	method = 'GET'
): HttpRequest =>
	(({
		method,
		params: {
			id: propertyAddress,
		},
		body: {
			account: accountAddress,
			message,
			signature,
			tags,
		},
	} as unknown) as HttpRequest)

const prepare = (): {
	readonly address: string
	readonly signature: string
	readonly message: string
} => {
	const web3 = new Web3()
	const account = web3.eth.accounts.create()
	const message = 'sign message'
	const { signature } = account.sign(message)
	const address = account.address
	return {
		address,
		signature,
		message,
	}
}

test('get property tags data', async (t) => {
	const context = createContext()
	const propertyAddress = '0x01234567890'
	const tags = 'test dummy'
	fakeStore.set(propertyAddress, tags.split(' '))

	await httpTrigger(context, createReq(propertyAddress))

	t.deepEqual(context.res, {
		status: 200,
		body: {
			id: propertyAddress,
			tags: tags.split(' '),
		},
	})
})

test('post peoperty tags data', async (t) => {
	const { address: accountAddress, signature, message } = prepare()
	const context = createContext()
	const method = 'POST'
	const propertyAddress = '0x01234567890'
	const tags = 'test dummy'
	fakeStore.set(propertyAddress, tags.split(' '))

	await httpTrigger(
		context,
		createReq(propertyAddress, accountAddress, message, signature, tags, method)
	)

	t.deepEqual(context.res, {
		status: 200,
		body: {
			id: propertyAddress,
			tags: tags.split(' '),
		},
	})
})

test('post peoperty tags data with old tags is empty', async (t) => {
	const { address: accountAddress, signature, message } = prepare()
	const context = createContext()
	const method = 'POST'
	const propertyAddress = '0x01234567890'
	const tags = undefined
	fakeStore.set(propertyAddress, tags)

	await httpTrigger(
		context,
		createReq(propertyAddress, accountAddress, message, signature, tags, method)
	)

	t.deepEqual(context.res, {
		status: 200,
		body: {
			id: propertyAddress,
			tags: [],
		},
	})
})

test('failure post request with invalid signature', async (t) => {
	const { address: accountAddress, message } = prepare()
	const context = createContext()
	const method = 'POST'
	const propertyAddress = '0x01234567890'
	const tags = 'test dummy'
	const invalidSignature =
		'0xde3857695618adfc20f598d59dc1fdfc820653e1affb2d16ccb5cf1821ead75a13d6b2cb50579bbec1d0a314ee417a356d6f3db389ce0a055e6badd03bbc50aaaa'

	await httpTrigger(
		context,
		createReq(
			propertyAddress,
			accountAddress,
			message,
			invalidSignature,
			tags,
			method
		)
	)

	t.deepEqual(context.res, {
		status: 400,
		body: '',
	})
})

test('invalid post request with empty request body', async (t) => {
	const { address: accountAddress, signature, message } = prepare()
	const context = createContext()
	const method = 'POST'
	const propertyAddress = '0x01234567890'
	const tags = 'test dummy'

	const testExec = async (
		accountAddress?: string,
		message?: string,
		signature?: string,
		tags?: string
	): Promise<void> => {
		await httpTrigger(
			context,
			createReq(
				propertyAddress,
				accountAddress,
				message,
				signature,
				tags,
				method
			)
		)

		t.deepEqual(context.res, {
			status: 400,
			body: '',
		})
	}

	const params = [
		{ accountAddress, message, tags },
		{ accountAddress, message, signature },
		{ accountAddress, signature, tags },
		{ message, signature, tags },
	]
	params.map((p) => testExec(p.accountAddress, p.message, p.signature, p.tags))
})
