import { Form, useSearchParams, useSubmit } from '@remix-run/react'
import { useDebounce, useIsPending } from '#app/utils/misc.tsx'
import { Icon } from './ui/icon.tsx'
import { Input } from './ui/input.tsx'
import { Label } from './ui/label.tsx'
import { StatusButton } from './ui/status-button.tsx'

export function SearchBar({
	status,
	autoFocus = false,
	autoSubmit = false,
}: {
	status: 'idle' | 'pending' | 'success' | 'error'
	autoFocus?: boolean
	autoSubmit?: boolean
}) {
	const [searchParams] = useSearchParams()
	const submit = useSubmit()
	const isPending = useIsPending({
		formMethod: 'GET',
		formAction: '/users',
	})

	const handleFormChange = useDebounce((form: HTMLFormElement) => {
		submit(form)
	}, 400)

	return (
		<Form
			method="GET"
			action="/users"
			className="flex flex-wrap items-center justify-center gap-2"
			onChange={e => autoSubmit && handleFormChange(e.currentTarget)}
		>
			<div className="flex-1">
				<Label htmlFor="search" className="sr-only">
					Search
				</Label>
				<Input
					type="search"
					name="search"
					id="search"
					defaultValue={searchParams.get('search') ?? ''}
					placeholder="Search"
					className="w-full"
					autoFocus={autoFocus}
				/>
			</div>
			<div>
				<StatusButton
					type="submit"
					status={isPending ? 'pending' : status}
					className="flex w-full items-center justify-center"
					size="sm"
					onClick={event => {
						if (event.metaKey) {
							event.preventDefault()
							// open in a new tab like a link
							window.open(
								`/users?search=${
									// @ts-expect-error - meh 🤷‍♂️
									event.currentTarget.form?.elements.search?.value ?? ''
								}`,
							)
						}
					}}
				>
					<Icon name="magnifying-glass" size="sm" />
					<span className="sr-only">Search</span>
				</StatusButton>
			</div>
		</Form>
	)
}
