export type AppLink = {
	title: string;
	description: string;
	href: string;
	icon: string;
	external?: boolean;
};

export const apps: AppLink[] = [
	{
		title: 'CP Quick',
		description: '2-param Monod model — instant CP & W\' from 3-min and 12-min max power',
		href: '/apps/cp-calc',
		icon: '⚡',
	},
	{
		title: 'CP Pro',
		description: '3-param Morton model — simulated annealing fit with outlier detection, training zones & power curve',
		href: '/apps/power-model',
		icon: '🚴',
	},
	{
		title: 'Performance Predict',
		description: 'Cycling segment time predictor with power, grade, wind and drafting inputs',
		href: 'https://equationzhao.github.io/performance-predict/',
		icon: '📈',
		external: true,
	},
	{
		title: 'Wuhun',
		description: '斗罗大陆先天武魂与先天魂力测试',
		href: 'https://equationzhao.github.io/wuhun/',
		icon: '🔮',
		external: true,
	},
];
