import React from 'react';
import PropTypes from 'prop-types';
import { SeafileMetadata } from '../../metadata';
import { Utils } from '../../utils/utils';
import { gettext, siteRoot, lang, mediaUrl } from '../../utils/constants';
import SeafileMarkdownViewer from '../seafile-markdown-viewer';

const propTypes = {
  path: PropTypes.string.isRequired,
  repoID: PropTypes.string.isRequired,
  hash: PropTypes.string,
  isFileLoading: PropTypes.bool.isRequired,
  isFileLoadedErr: PropTypes.bool.isRequired,
  filePermission: PropTypes.string,
  content: PropTypes.string,
  lastModified: PropTypes.string,
  latestContributor: PropTypes.string,
  onLinkClick: PropTypes.func.isRequired,
  currentRepoInfo: PropTypes.object,
};

class DirColumnFile extends React.Component {

  componentDidMount() {
    if (this.props.hash) {
      let hash = this.props.hash;
      setTimeout(function() {
        window.location.hash = hash;
      }, 500);
    }
  }

  onEditClick = (e) => {
    e.preventDefault();
    let { path, repoID } = this.props;
    let url = siteRoot + 'lib/' + repoID + '/file' + Utils.encodePath(path) + '?mode=edit';
    window.open(url);
  };

  onOpenFile = (e) => {
    e.preventDefault();
    let { path, repoID } = this.props;
    let newUrl = siteRoot + 'lib/' + repoID + '/file' + Utils.encodePath(path);
    window.open(newUrl, '_blank');
  };

  render() {
    if (this.props.isFileLoadedErr) {
      return (
        <div className="message err-tip">{gettext('File does not exist.')}</div>
      );
    }

    if (this.props.content === '__sf-metadata') {
      window.sfMetadata = {
        siteRoot,
        lang,
        mediaUrl,
      };

      return (
        <div className="w-100 h-100 o-hidden d-flex" style={{ paddingRight: 10, paddingLeft: 10, flexDirection: 'column', alignItems: 'center' }}>
          <div className="" style={{ width: '100%', height: 10, zIndex: 7, transform: 'translateZ(1000px)', position: 'relative', background: '#fff' }}></div>
          <SeafileMetadata repoID={this.props.repoID} currentRepoInfo={this.props.currentRepoInfo} />
        </div>
      );
    }

    return (
      <SeafileMarkdownViewer
        isTOCShow={false}
        isFileLoading={this.props.isFileLoading}
        markdownContent={this.props.content}
        lastModified = {this.props.lastModified}
        latestContributor={this.props.latestContributor}
        onLinkClick={this.props.onLinkClick}
        repoID={this.props.repoID}
        path={this.props.path}
      >
        <span className='wiki-open-file position-fixed' onClick={this.onOpenFile}>
          <i className="sf3-font sf3-font-expand-arrows-alt"></i>
        </span>
      </SeafileMarkdownViewer>
    );
  }
}

DirColumnFile.propTypes = propTypes;

export default DirColumnFile;
