import { type Password, type User } from '@prisma/client'
import { redirect } from '@remix-run/node'
import bcrypt from 'bcryptjs'
import { prisma } from '#app/utils/db.server.ts'
import { sessionStorage } from './session.server.ts'

export const SESSION_EXPIRATION_TIME = 1000 * 60 * 60 * 24 * 30
export const getSessionExpirationDate = () =>
	new Date(Date.now() + SESSION_EXPIRATION_TIME)

export const userIdKey = 'userId'

export async function getUserId(request: Request) {
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie'),
	)
	const userId = cookieSession.get(userIdKey)
	if (!userId) return null
	const user = await prisma.user.findUnique({
		select: { id: true },
		where: { id: userId },
	})
	if (!user) {
		return logout(request)
	}
	return user.id
}

export async function requireUserId(
	request: Request,
	{ redirectTo }: { redirectTo?: string | null } = {},
) {
	const userId = await getUserId(request)
	if (!userId) {
		const requestUrl = new URL(request.url)
		redirectTo =
			redirectTo === null
				? null
				: redirectTo ?? `${requestUrl.pathname}${requestUrl.search}`
		const loginParams = redirectTo ? new URLSearchParams({ redirectTo }) : null
		const loginRedirect = ['/login', loginParams?.toString()]
			.filter(Boolean)
			.join('?')
		throw redirect(loginRedirect)
	}
	return userId
}

export async function requireAnonymous(request: Request) {
	const userId = await getUserId(request)
	if (userId) {
		throw redirect('/')
	}
}

export async function login({
	username,
	password,
}: {
	username: User['username']
	password: string
}) {
	return verifyUserPassword({ username }, password)
}

export async function signup({
	email,
	username,
	password,
	name,
}: {
	email: User['email']
	username: User['username']
	name: User['name']
	password: string
}) {
	const hashedPassword = await getPasswordHash(password)

	const user = await prisma.user.create({
		select: { id: true },
		data: {
			email: email.toLowerCase(),
			username: username.toLowerCase(),
			name,
			password: {
				create: {
					hash: hashedPassword,
				},
			},
		},
	})

	return user
}

export async function logout(request: Request) {
	const cookieSession = await sessionStorage.getSession(
		request.headers.get('cookie'),
	)
	cookieSession.unset(userIdKey)
	throw redirect('/', {
		headers: {
			'set-cookie': await sessionStorage.commitSession(cookieSession),
		},
	})
}

export async function getPasswordHash(password: string) {
	const hash = await bcrypt.hash(password, 10)
	return hash
}

export async function verifyUserPassword(
	where: Pick<User, 'username'> | Pick<User, 'id'>,
	password: Password['hash'],
) {
	const userWithPassword = await prisma.user.findUnique({
		where,
		select: { id: true, password: { select: { hash: true } } },
	})

	if (!userWithPassword || !userWithPassword.password) {
		return null
	}

	const isValid = await bcrypt.compare(password, userWithPassword.password.hash)

	if (!isValid) {
		return null
	}

	return { id: userWithPassword.id }
}
