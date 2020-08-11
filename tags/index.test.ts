import test from 'ava'
import { stub } from 'sinon'
import { Context, HttpRequest } from '@azure/functions'
import { httpTrigger } from '.'
import * as db from '../db/tag'

stub(db, 'reader').callsFake(() => async (id: string) => {
	return {
		resource: {
			id,
		},
	} as any
})
stub(db, 'writer').callsFake(() => async (data: db.Tag) => {
	return {
		resource: data,
	} as any
})
stub(db, 'getTagsByWordWithForwardMatch').callsFake(
	() => async (word: string) => {
		return {
			resources: [{ id: `${word}-tag` }],
		} as any
	}
)

const createContext = (): Context =>
	(({
		res: {},
		log: () => {
			// fake logger
		},
	} as unknown) as Context)

const createReq = (searchWord?: string, method = 'GET'): HttpRequest =>
	(({
		method,
		query: {
			w: searchWord || 'test',
		},
	} as unknown) as HttpRequest)

test('get tags data', async (t) => {
	const context = createContext()

	await httpTrigger(context, createReq())

	t.deepEqual(context.res, {
		status: 200,
		body: {
			result: [
				{
					id: 'test-tag',
				},
			],
		},
	})
})
