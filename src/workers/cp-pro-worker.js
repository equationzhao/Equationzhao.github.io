import { analyzeCpPro } from '../lib/cp-pro-model.js';

self.addEventListener('message', (event) => {
	try {
		self.postMessage({ ok: true, result: analyzeCpPro(event.data) });
	} catch (error) {
		self.postMessage({
			ok: false,
			error: {
				name: error?.name ?? 'Error',
				code: error?.code ?? null,
				message: error?.message ?? 'CP Pro analysis failed.',
			},
		});
	}
});
