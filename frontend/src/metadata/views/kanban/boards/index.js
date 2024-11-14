import React, { useMemo, useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { useMetadataView } from '../../../hooks/metadata-view';
import { useCollaborators } from '../../../hooks';
import { CellType, KANBAN_SETTINGS_KEYS, UNCATEGORIZED, FILE_TYPE } from '../../../constants';
import { COLUMN_DATA_OPERATION_TYPE } from '../../../store/operations';
import { gettext, siteRoot } from '../../../../utils/constants';
import { checkIsPredefinedOption, getCellValueByColumn, isValidCellValue, geRecordIdFromRecord } from '../../../utils/cell';
import { getColumnOptions, getColumnOriginName } from '../../../utils/column';
import AddBoard from '../add-board';
import EmptyTip from '../../../../components/empty-tip';
import Board from './board';
import { Utils } from '../../../../utils/utils';
import { EVENT_BUS_TYPE } from '../../../../components/common/event-bus-type';
import ImagePreviewer from '../../../components/cell-formatter/image-previewer';
import { getRowById } from '../../../utils/table';

import './index.css';

const Boards = ({ modifyRecord, modifyColumnData, onCloseSettings }) => {
  const [haveFreezed, setHaveFreezed] = useState(false);
  const [isImagePreviewerVisible, setImagePreviewerVisible] = useState(false);
  const [record, setRecord] = useState(null);

  const { metadata, store } = useMetadataView();
  const { collaborators } = useCollaborators();

  const groupByColumn = useMemo(() => {
    const groupByColumnKey = metadata.view.settings[KANBAN_SETTINGS_KEYS.GROUP_BY_COLUMN_KEY];
    return metadata.key_column_map[groupByColumnKey];
  }, [metadata.key_column_map, metadata.view.settings]);

  const titleColumn = useMemo(() => {
    const titleFieldKey = metadata.view.settings[KANBAN_SETTINGS_KEYS.TITLE_COLUMN_KEY];
    return metadata.key_column_map[titleFieldKey];
  }, [metadata.key_column_map, metadata.view.settings]);

  const displayColumns = useMemo(() => {
    const displayColumnsConfig = metadata.view.settings[KANBAN_SETTINGS_KEYS.COLUMNS];
    const titleFieldKey = metadata.view.settings[KANBAN_SETTINGS_KEYS.TITLE_COLUMN_KEY];
    if (!displayColumnsConfig) return [];
    return displayColumnsConfig.filter(config => config.shown).map(config => metadata.key_column_map[config.key]).filter(column => column && column.key !== titleFieldKey);
  }, [metadata.key_column_map, metadata.view.settings]);

  const displayEmptyValue = useMemo(() => !metadata.view.settings[KANBAN_SETTINGS_KEYS.HIDE_EMPTY_VALUE], [metadata.view.settings]);
  const displayColumnName = useMemo(() => metadata.view.settings[KANBAN_SETTINGS_KEYS.SHOW_COLUMN_NAME], [metadata.view.settings]);
  const textWrap = useMemo(() => metadata.view.settings[KANBAN_SETTINGS_KEYS.TEXT_WRAP], [metadata.view.settings]);

  /**
    [
      {
        key: '',
        value: '',
        children: [ rowId ]
      }, {
        key: '',
        value: '',
        children: [ rowId ]
      },
    ]
  */
  const boards = useMemo(() => {
    if (!groupByColumn) return [];
    const groupByColumnType = groupByColumn.type;

    const { rows } = metadata;
    let ungroupedCard = { key: UNCATEGORIZED, value: null, children: [] };
    let boardsMap = {};

    if (groupByColumnType === CellType.SINGLE_SELECT) {
      boardsMap = groupByColumn.data.options.reduce((pre, cur) => {
        const key = checkIsPredefinedOption(groupByColumn, cur.id) ? cur.id : cur.name;
        pre[key] = [];
        return pre;
      }, {});
    } else if (groupByColumnType === CellType.COLLABORATOR) {
      if (Array.isArray(collaborators)) {
        collaborators.forEach(collaborator => {
          boardsMap[collaborator.email] = [];
        });
      }
    }

    rows.forEach(row => {
      const cellValue = getCellValueByColumn(row, groupByColumn);
      const recordId = geRecordIdFromRecord(row);
      if (isValidCellValue(cellValue)) {
        switch (groupByColumnType) {
          case CellType.SINGLE_SELECT: {
            if (boardsMap[cellValue]) {
              boardsMap[cellValue].push(recordId);
            } else {
              ungroupedCard.children.push(recordId);
            }
            break;
          }
          case CellType.COLLABORATOR: {
            Array.isArray(cellValue) && cellValue.forEach(email => {
              if (boardsMap[email]) {
                boardsMap[email].push(recordId);
              } else {
                ungroupedCard.children.push(recordId);
              }
            });
            break;
          }
          default: {
            break;
          }
        }
      } else {
        ungroupedCard.children.push(recordId);
      }
    });

    let _boards = [];
    if (groupByColumn.type === CellType.SINGLE_SELECT) {
      const options = getColumnOptions(groupByColumn);
      _boards = options.map(option => {
        if (checkIsPredefinedOption(groupByColumn, option.id)) return { key: option.id, value: option.id, children: boardsMap[option.id] };
        return { key: option.id, value: option.name, children: boardsMap[option.name] };
      });
    } else if (groupByColumn.type === CellType.COLLABORATOR) {
      _boards = collaborators.map(collaborator => ({
        key: collaborator.email,
        value: collaborator.email,
        children: boardsMap[collaborator.email],
      }));
    }
    if (ungroupedCard.children.length > 0) {
      _boards.unshift(ungroupedCard);
    }
    return _boards;
  }, [metadata, collaborators, groupByColumn]);

  const readonly = useMemo(() => {
    if (!store.context.canModify()) return true;
    if (!groupByColumn) return true;
    if (!groupByColumn.editable) return true;
    if (groupByColumn.type === CellType.SINGLE_SELECT) return false;
    return true;
  }, [groupByColumn, store]);

  const deleteOption = useCallback((optionId) => {
    const oldData = groupByColumn.data;
    const oldOptions = getColumnOptions(groupByColumn);
    const newOptions = oldOptions.filter(o => o.id !== optionId);
    const optionModifyType = COLUMN_DATA_OPERATION_TYPE.DELETE_OPTION;
    modifyColumnData(groupByColumn.key, { options: newOptions }, { options: oldData.options }, { optionModifyType });
  }, [groupByColumn, modifyColumnData]);

  const onMove = useCallback((targetBoardIndex, sourceBoardIndex, sourceCardIndex) => {
    const targetBoard = boards[targetBoardIndex];
    const sourceBoard = boards[sourceBoardIndex];
    const sourceCard = sourceBoard.children[sourceCardIndex];
    const originName = getColumnOriginName(groupByColumn);
    const updates = { [originName]: targetBoard.value };
    const originalUpdates = { [groupByColumn.key]: targetBoard.value };
    const oldRowData = { [originName]: sourceBoard.value };
    const originalOldRowData = { [groupByColumn.key]: sourceBoard.value };
    modifyRecord(sourceCard, updates, oldRowData, originalUpdates, originalOldRowData);
  }, [boards, groupByColumn, modifyRecord]);

  const onFreezed = useCallback(() => {
    setHaveFreezed(true);
  }, []);

  const onUnFreezed = useCallback(() => {
    setHaveFreezed(false);
  }, []);

  const isEmpty = boards.length === 0;

  const generateUrl = (fileName, parentDir) => {
    const repoID = window.sfMetadataContext.getSetting('repoID');
    const path = Utils.encodePath(Utils.joinPath(parentDir, fileName));
    return `${siteRoot}lib/${repoID}/file${path}`;
  };

  const openMarkdown = useCallback((name, parentDir) => {
    window.sfMetadataContext.eventBus.dispatch(EVENT_BUS_TYPE.OPEN_MARKDOWN_DIALOG, parentDir, name);
  }, []);

  const openByNewWindow = useCallback((fileType, fileName, parentDir) => {
    if (!fileType) {
      const url = generateUrl(fileName, parentDir);
      window.open(url);
    } else {
      let pathname = window.location.pathname;
      if (pathname.endsWith('/')) {
        pathname = pathname.slice(0, -1);
      }
      window.open(window.location.origin + pathname + Utils.encodePath(Utils.joinPath(parentDir, fileName)));
    }
  }, []);

  const openSdoc = useCallback((fileName, parentDir) => {
    const url = generateUrl(fileName, parentDir);
    window.open(url);
  }, []);

  const openFile = useCallback((type, fileName, parentDir, recordId = null) => {
    switch (type) {
      case FILE_TYPE.MARKDOWN: {
        openMarkdown(fileName, parentDir);
        break;
      }
      case FILE_TYPE.SDOC: {
        openSdoc(fileName, parentDir);
        break;
      }
      case FILE_TYPE.IMAGE: {
        const record = getRowById(metadata, recordId);
        setRecord(record);
        setImagePreviewerVisible(true);
        break;
      }
      default: {
        openByNewWindow(type, fileName, parentDir);
        break;
      }
    }
  }, [openMarkdown, openSdoc, openByNewWindow, metadata]);

  const closeImagePreviewer = useCallback(() => {
    setImagePreviewerVisible(false);
  }, []);

  return (
    <div className={classnames('sf-metadata-view-kanban-boards', {
      'sf-metadata-view-kanban-boards-text-wrap': textWrap,
      'readonly': readonly,
    })}
    >
      <div className="smooth-dnd-container horizontal">
        {isEmpty && (<EmptyTip className="tips-empty-boards" text={gettext('No categories')} />)}
        {!isEmpty && (
          <>
            {boards.map((board, index) => {
              return (
                <Board
                  key={board.key}
                  board={board}
                  index={index}
                  readonly={readonly}
                  displayEmptyValue={displayEmptyValue}
                  displayColumnName={displayColumnName}
                  haveFreezed={haveFreezed}
                  groupByColumn={groupByColumn}
                  titleColumn={titleColumn}
                  displayColumns={displayColumns}
                  onMove={onMove}
                  deleteOption={deleteOption}
                  onFreezed={onFreezed}
                  onUnFreezed={onUnFreezed}
                  onCloseSettings={onCloseSettings}
                  onOpenFile={openFile}
                />
              );
            })}
          </>
        )}
        {!readonly && (<AddBoard groupByColumn={groupByColumn}/>)}
      </div>
      {isImagePreviewerVisible && (<ImagePreviewer record={record} table={metadata} closeImagePopup={closeImagePreviewer} />)}
    </div>
  );
};

Boards.propTypes = {
  modifyRecord: PropTypes.func.isRequired,
  modifyColumnData: PropTypes.func.isRequired,
  onCloseSettings: PropTypes.func.isRequired,
};

export default Boards;
