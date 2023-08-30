import { authenticator } from '#app/utils/auth.server.ts'
import { redirect, type DataFunctionArgs } from '@remix-run/node'

export async function loader() {
	return redirect('/login')
}

export async function action({ request }: DataFunctionArgs) {
	const providerName = 'github'

	if (process.env.GITHUB_CLIENT_ID?.startsWith('MOCK_')) {
		throw redirect(`/auth/github/callback?code=MOCK_CODE&state=MOCK_STATE`)
	}

	return await authenticator.authenticate(providerName, request)
}
