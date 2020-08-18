import test from 'ava'
import { stub } from 'sinon'
import { Context, HttpRequest } from '@azure/functions'
import { httpTrigger } from '.'
import * as db from '../db/property-tags'

stub(db, 'reader').callsFake(() => async (id: string) => {
	return {
		resource: {
			id,
			displayName: 'req-dummy-address-name',
		},
	} as any
})
stub(db, 'writer').callsFake(() => async (data: db.PropertyTags) => {
	return {
		resource: data,
	} as any
})
stub(db, 'getAllPropertiesByTag').callsFake(() => async (tag: string) => {
	return {
		resources: [
			{
				id: '0x01234567890',
				tags: [tag, 'dummy'],
			},
		],
	} as any
})

const createContext = (): Context =>
	(({
		res: {},
		log: () => {
			// fake logger
		},
	} as unknown) as Context)

const createReq = (tags: string, method = 'POST'): HttpRequest =>
	(({
		method,
		body: {
			tags,
		},
	} as unknown) as HttpRequest)

test('search property tags data', async (t) => {
	const context = createContext()
	const tags = 'test dummy'

	await httpTrigger(context, createReq(tags))

	t.deepEqual(context.res, {
		status: 200,
		body: {
			result: [
				{
					id: '0x01234567890',
					tags: tags.split(' '),
				},
			],
		},
	})
})

test('search property tags with empty body data', async (t) => {
	const context = createContext()
	const tags = ''

	await httpTrigger(context, createReq(tags))

	t.deepEqual(context.res, {
		status: 400,
		body: '',
	})
})

test('search property tags with blank body data', async (t) => {
	const context = createContext()
	const tags = ' '

	await httpTrigger(context, createReq(tags))

	t.deepEqual(context.res, {
		status: 400,
		body: '',
	})
})

test('failure to get access', async (t) => {
	const context = createContext()
	const tags = 'test dummy'
	const method = 'GET'

	await httpTrigger(context, createReq(tags, method))

	t.deepEqual(context.res, {
		status: 400,
		body: '',
	})
})
