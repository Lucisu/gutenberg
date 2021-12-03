/**
 * WordPress dependencies
 */
import { store as blocksStore } from '@wordpress/blocks';
import {
	registerCoreBlocks,
	__experimentalRegisterExperimentalCoreBlocks,
} from '@wordpress/block-library';
import { dispatch, select } from '@wordpress/data';
import { render, unmountComponentAtNode } from '@wordpress/element';
import {
	__experimentalFetchLinkSuggestions as fetchLinkSuggestions,
	__experimentalFetchUrlData as fetchUrlData,
} from '@wordpress/core-data';
import { store as editorStore } from '@wordpress/editor';
import { store as viewportStore } from '@wordpress/viewport';
import { getQueryArg } from '@wordpress/url';

/**
 * Internal dependencies
 */
import './plugins';
import './hooks';
import { store as editSiteStore } from './store';
import { Routes } from './components/routes';
import Editor from './components/editor';
import List from './components/list';

/**
 * Reinitializes the editor after the user chooses to reboot the editor after
 * an unhandled error occurs, replacing previously mounted editor element using
 * an initial state from prior to the crash.
 *
 * @param {Element} target   DOM node in which editor is rendered.
 * @param {?Object} settings Editor settings object.
 */
export function reinitializeEditor( target, settings ) {
	unmountComponentAtNode( target );
	const reboot = reinitializeEditor.bind( null, target, settings );

	dispatch( editorStore ).updateEditorSettings( settings );

	if ( ! getQueryArg( window.location.href, 'postId' ) ) {
		// Default the navigation panel to be opened when we're in a bigger
		// screen and land in the list screen.
		// We update the store synchronously before rendering so that we won't
		// trigger an unnecessary re-render with useEffect.
		dispatch( editSiteStore ).setIsNavigationPanelOpened(
			select( viewportStore ).isViewportMatch( 'medium' )
		);
	}

	render(
		<Routes>
			{ ( { params: { postType, postId } } ) => {
				if ( ! postId && postType ) {
					return <List templateType={ postType } />;
				}

				return (
					<Editor initialSettings={ settings } onError={ reboot } />
				);
			} }
		</Routes>,
		target
	);
}

/**
 * Initializes the site editor screen.
 *
 * @param {string} id       ID of the root element to render the screen in.
 * @param {Object} settings Editor settings.
 */
export function initializeEditor( id, settings ) {
	settings.__experimentalFetchLinkSuggestions = ( search, searchOptions ) =>
		fetchLinkSuggestions( search, searchOptions, settings );
	settings.__experimentalFetchRichUrlData = fetchUrlData;
	settings.__experimentalSpotlightEntityBlocks = [ 'core/template-part' ];

	const target = document.getElementById( id );

	dispatch( blocksStore ).__experimentalReapplyBlockTypeFilters();
	registerCoreBlocks();
	if ( process.env.GUTENBERG_PHASE === 2 ) {
		__experimentalRegisterExperimentalCoreBlocks( {
			enableFSEBlocks: true,
		} );
	}

	reinitializeEditor( target, settings );
}

export { default as __experimentalMainDashboardButton } from './components/main-dashboard-button';
export { default as __experimentalNavigationToggle } from './components/navigation-sidebar/navigation-toggle';
export { default as PluginSidebar } from './components/sidebar/plugin-sidebar';
export { default as PluginSidebarMoreMenuItem } from './components/header/plugin-sidebar-more-menu-item';
export { default as PluginMoreMenuItem } from './components/header/plugin-more-menu-item';
