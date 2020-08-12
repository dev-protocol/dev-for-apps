import test from 'ava'
import { CosmosClient } from '@azure/cosmos'
import {
	createDBInstance,
	reader,
	writer,
	getAllPropertiesByTag,
	countAllPropertiesByTag,
} from './property-tags'

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
									query: ({ query, parameters }: any) => ({
										fetchAll: async () => {
											return {
												resources: [
													query.includes('VALUE COUNT')
														? 1
														: {
																id: '0x01234567890',
																tags: [parameters[0].value],
														  },
												],
											}
										},
									}),
									upsert: async (options: any) => {
										fakeStore.set(options.id, options.tags)
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

test('insert new property tags data', async (t) => {
	const propertyAddress = '0x01234567890'
	const result = await writer((createStub() as unknown) as typeof CosmosClient)(
		{
			id: propertyAddress,
			tags: [],
		}
	)
	t.is(result.item.container.database.id, 'Stakes.social')
	t.is(result.item.container.id, 'PropertyTags')
	t.deepEqual((result as any).options, {
		id: propertyAddress,
		tags: [],
	})
	t.is(fakeStore.get(propertyAddress)?.length, 0)

	await writer((createStub() as unknown) as typeof CosmosClient)({
		id: propertyAddress,
		tags: ['a', 'b'],
	})
	t.is(fakeStore.get(propertyAddress)?.length, 2)
})

test('read property tags data', async (t) => {
	const propertyAddress = '0x01234567890'
	const result = await reader((createStub() as unknown) as typeof CosmosClient)(
		propertyAddress
	)
	t.is(result.item.container.database.id, 'Stakes.social')
	t.is(result.item.container.id, 'PropertyTags')
	t.is(result.resource?.id, propertyAddress)
})

test('search property tags by tag', async (t) => {
	const propertyAddress = '0x01234567890'
	const tag = 'dummy-tag'
	const result = await getAllPropertiesByTag(
		(createStub() as unknown) as typeof CosmosClient
	)(tag)
	t.deepEqual(result.resources, [{ id: propertyAddress, tags: [tag] }])
})

test('count property tags by tag', async (t) => {
	const tag = 'dummy-tag'
	const result = await countAllPropertiesByTag(
		(createStub() as unknown) as typeof CosmosClient
	)(tag)
	t.is(result, 1)
})
