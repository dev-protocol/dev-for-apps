import test from 'ava'
import { CosmosClient } from '@azure/cosmos'
import {
	createDBInstance,
	reader,
	writer,
	deleteTag,
	getTagsByWordWithForwardMatch,
} from './tag'

// eslint-disable-next-line functional/prefer-readonly-type
const fakeStore: Map<string, string> = new Map()

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
const createStub = () =>
	// eslint-disable-next-line functional/no-class
	class Stub {
		public readonly databases = {
			createIfNotExists: async ({ id: database }: { readonly id: string }) => ({
				database: {
					containers: {
						createIfNotExists: async ({
							id: container,
						}: {
							readonly id: string
						}) => ({
							container: {
								items: {
									create: async (options: any) => {
										return {
											item: {
												container: {
													database: {
														id: database,
													},
													id: container,
												},
											},
											options,
										}
									},
									query: ({ parameters }: any) => ({
										fetchAll: async () => {
											return {
												resources: [{ id: parameters[0].value }],
											}
										},
									}),
									upsert: async (options: any) => {
										return {
											item: {
												container: {
													database: {
														id: database,
													},
													id: container,
												},
											},
											options,
										}
									},
								},
								item: (id: string) => ({
									read: async () => {
										return {
											item: {
												container: {
													database: {
														id: database,
													},
													id: container,
												},
												id,
											},
											resource:
												id === 'dummy-empty-id'
													? null
													: {
															id,
													  },
										}
									},
									delete: async () => {
										fakeStore.delete('id')
										return {
											item: {
												container: {
													database: {
														id: database,
													},
													id: container,
												},
												id,
											},
										}
									},
								}),
							},
						}),
					},
				},
			}),
		}
	}

test('An instance of the database is created', async (t) => {
	const instance = await createDBInstance(
		(createStub() as unknown) as typeof CosmosClient,
		{
			database: 'dummy-database',
			container: 'dummy-container',
		},
		process.env
	)
	const result = await instance.items.create({
		id: 'dummy-id',
		displayName: 'dummy-name',
	})
	t.is(result.item.container.database.id, 'dummy-database')
	t.is(result.item.container.id, 'dummy-container')
})

test('insert new tag data', async (t) => {
	const result = await writer((createStub() as unknown) as typeof CosmosClient)(
		{
			id: 'dummy-tag',
		}
	)
	t.is(result.item.container.database.id, 'Stakes.social')
	t.is(result.item.container.id, 'Tag')
	t.deepEqual((result as any).options, {
		id: 'dummy-tag',
	})
})

test('upsert tag data', async (t) => {
	await writer((createStub() as unknown) as typeof CosmosClient)({
		id: 'dummy-tag',
	})
	const result = await writer((createStub() as unknown) as typeof CosmosClient)(
		{
			id: 'dummy-tag2',
		}
	)
	t.is(result.item.container.database.id, 'Stakes.social')
	t.is(result.item.container.id, 'Tag')
	t.deepEqual((result as any).options, {
		id: 'dummy-tag2',
	})
})

test('read tag data', async (t) => {
	const result = await reader((createStub() as unknown) as typeof CosmosClient)(
		'dummy-tag'
	)
	t.is(result.item.container.database.id, 'Stakes.social')
	t.is(result.item.container.id, 'Tag')
	t.is(result.resource?.id, 'dummy-tag')
})

test('delete tag data', async (t) => {
	const tag = 'dummy-tag'
	fakeStore.set('id', tag) as any

	const result = await deleteTag(
		(createStub() as unknown) as typeof CosmosClient
	)(tag)
	t.is(result.item.container.database.id, 'Stakes.social')
	t.is(result.item.container.id, 'Tag')

	t.is(fakeStore.get('id'), undefined)
})

test('search tag data with forward match', async (t) => {
	const tag = 'dummy-tag'

	const result = await getTagsByWordWithForwardMatch(
		(createStub() as unknown) as typeof CosmosClient
	)(tag)
	t.deepEqual(result.resources, [{ id: tag }])
})
