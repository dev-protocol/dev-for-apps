import test from 'ava'
import { CosmosClient } from '@azure/cosmos'
import { createDBInstance, reader, writer } from './db'

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
															addressName: 'dummy-test-name',
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
		addressName: 'dummy-name',
	})
	t.is(result.item.container.database.id, 'dummy-database')
	t.is(result.item.container.id, 'dummy-container')
})

test('insert new user data', async (t) => {
	const result = await writer((createStub() as unknown) as typeof CosmosClient)(
		{
			id: 'dummy-id',
			addressName: 'dummy-name',
		}
	)
	t.is(result.item.container.database.id, 'Stakes.social')
	t.is(result.item.container.id, 'User')
	t.deepEqual((result as any).options, {
		id: 'dummy-id',
		addressName: 'dummy-name',
	})
})

test('upsert user data', async (t) => {
	await writer((createStub() as unknown) as typeof CosmosClient)({
		id: 'dummy-id',
		addressName: 'dummy-name',
	})
	const result = await writer((createStub() as unknown) as typeof CosmosClient)(
		{
			id: 'dummy-id2',
			addressName: 'dummy-name2',
		}
	)
	t.is(result.item.container.database.id, 'Stakes.social')
	t.is(result.item.container.id, 'User')
	t.deepEqual((result as any).options, {
		id: 'dummy-id2',
		addressName: 'dummy-name2',
	})
})

test('read empty user data', async (t) => {
	const result = await reader((createStub() as unknown) as typeof CosmosClient)(
		'dummy-empty-id'
	)
	t.is(result.item.container.database.id, 'Stakes.social')
	t.is(result.item.container.id, 'User')
	t.is(result.resource?.id, undefined)
	t.is(result.resource?.addressName, undefined)
})

test('read user data', async (t) => {
	const result = await reader((createStub() as unknown) as typeof CosmosClient)(
		'dummy-test-id'
	)
	t.is(result.item.container.database.id, 'Stakes.social')
	t.is(result.item.container.id, 'User')
	t.is(result.resource?.id, 'dummy-test-id')
	t.is(result.resource?.addressName, 'dummy-test-name')
})
