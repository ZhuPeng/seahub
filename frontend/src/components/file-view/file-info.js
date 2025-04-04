import React from 'react';
import PropTypes from 'prop-types';
import dayjs from 'dayjs';
import { isPro, gettext, mediaUrl, siteRoot } from '../../utils/constants';
import InternalLinkOperation from '../operations/internal-link-operation';

const propTypes = {
  toggleStar: PropTypes.func.isRequired,
  isLocked: PropTypes.bool.isRequired,
  isStarred: PropTypes.bool.isRequired,
  isOnlyofficeFile: PropTypes.bool.isRequired
};

const { fileName, repoID, filePath,
  latestContributor, latestContributorName, lastModificationTime
} = window.app.pageOptions;

class FileInfo extends React.PureComponent {

  constructor(props) {
    super(props);
  }

  toggleStar = (e) => {
    e.preventDefault();
    this.props.toggleStar();
  };

  render() {
    const { isStarred, isLocked, isOnlyofficeFile } = this.props;
    const starredText = isStarred ? gettext('starred') : gettext('unstarred');
    const lockedText = gettext('locked');
    return (
      <div className="text-truncate">
        <h2 className="file-title d-flex align-items-center">
          <span className="file-name text-truncate" title={fileName}>{fileName}</span>
          <a className={`file-star sf3-font ${isStarred ? 'sf3-font-star' : 'sf3-font-star-empty'}`}
            href="#"
            title={starredText}
            role="button"
            aria-label={isStarred ? gettext('Unstar') : gettext('Star')}
            onClick={this.toggleStar}>
          </a>
          <InternalLinkOperation repoID={repoID} path={filePath} />
          {(isPro && isLocked && !isOnlyofficeFile) &&
            <img className="file-locked-icon" width="16"
              src={`${mediaUrl}img/file-locked-32.png`}
              alt={lockedText}
              title={lockedText}
              aria-label={lockedText}
            />
          }
        </h2>
        {!isOnlyofficeFile && (
          <div className="meta-info">
            <a href={`${siteRoot}profile/${encodeURIComponent(latestContributor)}/`}>{latestContributorName}</a>
            <span className="ml-2">{dayjs(lastModificationTime * 1000).format('YYYY-MM-DD HH:mm')}</span>
          </div>
        )}
      </div>
    );
  }
}

FileInfo.propTypes = propTypes;

export default FileInfo;
