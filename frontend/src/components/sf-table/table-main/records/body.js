import React, { Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import { Loading } from '@seafile/sf-metadata-ui-component';
import { RightScrollbar } from '../../scrollbar';
import Record from './record';
import InteractionMasks from '../../masks/interaction-masks';
import { RecordMetrics } from '../../utils/record-metrics';
import { getColumnScrollPosition, getColVisibleStartIdx, getColVisibleEndIdx } from '../../utils/records-body-utils';
import EventBus from '../../../common/event-bus';
import { EVENT_BUS_TYPE } from '../../constants/event-bus-type';
import { isShiftKeyDown } from '../../../../utils/keyboard-utils';
import { checkEditableViaClickCell, checkIsColumnSupportDirectEdit, getColumnByIndex, getColumnIndexByKey } from '../../utils/column';
import { checkIsCellSupportOpenEditor } from '../../utils/selected-cell-utils';

const ROW_HEIGHT = 33;
const RENDER_MORE_NUMBER = 10;
const CONTENT_HEIGHT = window.innerHeight - 174;
const { max, min, ceil, round } = Math;

class RecordsBody extends Component {

  static defaultProps = {
    editorPortalTarget: document.body,
    scrollToRowIndex: 0,
  };

  constructor(props) {
    super(props);
    this.state = {
      startRenderIndex: 0,
      endRenderIndex: this.getInitEndIndex(props),
      activeRecords: [],
      menuPosition: null,
      selectedPosition: null,
      isScrollingRightScrollbar: false,
    };
    this.eventBus = EventBus.getInstance();
    this.resultContentRef = null;
    this.resultRef = null;
    this.recordFrozenRefs = [];
    this.rowVisibleStart = 0;
    this.rowVisibleEnd = this.setRecordVisibleEnd();
    this.columnVisibleStart = 0;
    this.columnVisibleEnd = this.props.getColumnVisibleEnd();
    this.timer = null;
  }

  componentDidMount() {
    this.props.onRef(this);
    window.sfTableBody = this;
    this.unsubscribeFocus = this.eventBus.subscribe(EVENT_BUS_TYPE.FOCUS_CANVAS, this.onFocus);
    this.unsubscribeSelectColumn = this.eventBus.subscribe(EVENT_BUS_TYPE.SELECT_COLUMN, this.onColumnSelect);
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    const { recordsCount, recordIds } = nextProps;
    if (recordsCount !== this.props.recordsCount || recordIds !== this.props.recordIds) {
      this.recalculateRenderIndex(recordIds);
    }
  }

  componentWillUnmount() {
    this.storeScrollPosition();
    this.clearHorizontalScroll();
    this.clearScrollbarTimer();
    this.unsubscribeFocus();
    this.unsubscribeSelectColumn();
    window.sfTableBody = null;
    this.setState = (state, callback) => {
      return;
    };
  }

  storeScrollPosition = () => {
    this.props.storeScrollPosition();
  };

  onFocus = () => {
    if (this.interactionMask.container) {
      this.interactionMask.focus();
      return;
    }
    this.resultContentRef.focus();
  };

  onColumnSelect = (column) => {
    const { columns } = this.props;
    const selectColumnIndex = getColumnIndexByKey(column.key, columns);
    this.setState({
      selectedPosition: { ...this.state.selectedPosition, idx: selectColumnIndex, rowIdx: 0 },
    });
  };

  getVisibleIndex = () => {
    return { rowVisibleStartIdx: this.rowVisibleStart, rowVisibleEndIdx: this.rowVisibleEnd };
  };

  getShownRecords = () => {
    return this.getShownRecordIds().map((id) => this.props.recordGetterById(id));
  };

  setRecordVisibleEnd = () => {
    return max(ceil(CONTENT_HEIGHT / ROW_HEIGHT), 0);
  };

  recalculateRenderIndex = (recordIds) => {
    const { startRenderIndex, endRenderIndex } = this.state;
    const contentScrollTop = this.resultContentRef.scrollTop;
    const start = Math.max(0, Math.floor(contentScrollTop / ROW_HEIGHT) - RENDER_MORE_NUMBER);
    const { height } = this.props.getTableContentRect();
    const end = Math.min(Math.ceil((contentScrollTop + height) / ROW_HEIGHT) + RENDER_MORE_NUMBER, recordIds.length);
    if (start !== startRenderIndex) {
      this.setState({ startRenderIndex: start });
    }
    if (end !== endRenderIndex) {
      this.setState({ endRenderIndex: end });
    }
  };

  getInitEndIndex = (props) => {
    return Math.min(Math.ceil(window.innerHeight / ROW_HEIGHT) + RENDER_MORE_NUMBER, props.recordsCount);
  };

  getShownRecordIds = () => {
    const { recordIds } = this.props;
    const { startRenderIndex, endRenderIndex } = this.state;
    return recordIds.slice(startRenderIndex, endRenderIndex);
  };

  getRowTop = (rowIdx) => {
    return ROW_HEIGHT * rowIdx;
  };

  getRowHeight = () => {
    return ROW_HEIGHT;
  };

  jumpToRow = (scrollToRowIndex) => {
    const { recordsCount } = this.props;
    const rowHeight = this.getRowHeight();
    const height = this.resultContentRef.offsetHeight;
    const scrollTop = Math.min(scrollToRowIndex * rowHeight, recordsCount * rowHeight - height);
    this.setScrollTop(scrollTop);
  };

  scrollToColumn = (idx) => {
    const { columns, getTableContentRect } = this.props;
    const { width: tableContentWidth } = getTableContentRect();
    const newScrollLeft = getColumnScrollPosition(columns, idx, tableContentWidth);
    if (newScrollLeft !== null) {
      this.props.setRecordsScrollLeft(newScrollLeft);
    }
    this.updateColVisibleIndex(newScrollLeft);
  };

  updateColVisibleIndex = (scrollLeft) => {
    const { columns } = this.props;
    const columnVisibleStart = getColVisibleStartIdx(columns, scrollLeft);
    const columnVisibleEnd = getColVisibleEndIdx(columns, window.innerWidth, scrollLeft);
    this.columnVisibleStart = columnVisibleStart;
    this.columnVisibleEnd = columnVisibleEnd;
  };

  setScrollTop = (scrollTop) => {
    this.resultContentRef.scrollTop = scrollTop;
  };

  setScrollLeft = (scrollLeft, scrollTop) => {
    const { interactionMask } = this;
    interactionMask && interactionMask.setScrollLeft(scrollLeft, scrollTop);
  };

  cancelSetScrollLeft = () => {
    const { interactionMask } = this;
    interactionMask && interactionMask.cancelSetScrollLeft();
  };

  getClientScrollTopOffset = (node) => {
    const rowHeight = this.getRowHeight();
    const scrollVariation = node.scrollTop % rowHeight;
    return scrollVariation > 0 ? rowHeight - scrollVariation : 0;
  };

  onHitBottomCanvas = () => {
    const rowHeight = this.getRowHeight();
    const node = this.resultContentRef;
    node.scrollTop += rowHeight + this.getClientScrollTopOffset(node);
  };

  onHitTopCanvas = () => {
    const rowHeight = this.getRowHeight();
    const node = this.resultContentRef;
    node.scrollTop -= (rowHeight - this.getClientScrollTopOffset(node));
  };

  getScrollTop = () => {
    return this.resultContentRef ? this.resultContentRef.scrollTop : 0;
  };

  getRecordBodyHeight = () => {
    return this.resultContentRef ? this.resultContentRef.offsetHeight : 0;
  };

  onScroll = () => {
    const { recordsCount } = this.props;
    const { startRenderIndex, endRenderIndex } = this.state;
    const { offsetHeight, scrollTop: contentScrollTop } = this.resultContentRef;

    // Calculate the start rendering row index, and end rendering row index
    const start = Math.max(0, Math.floor(contentScrollTop / ROW_HEIGHT) - RENDER_MORE_NUMBER);
    const end = Math.min(Math.ceil((contentScrollTop + this.resultContentRef.offsetHeight) / ROW_HEIGHT) + RENDER_MORE_NUMBER, recordsCount);

    this.oldScrollTop = contentScrollTop;
    const renderedRecordsCount = ceil(this.resultContentRef.offsetHeight / ROW_HEIGHT);
    const newRecordVisibleStart = max(0, round(contentScrollTop / ROW_HEIGHT));
    const newRecordVisibleEnd = min(newRecordVisibleStart + renderedRecordsCount, recordsCount);
    this.rowVisibleStart = newRecordVisibleStart;
    this.rowVisibleEnd = newRecordVisibleEnd;

    if (Math.abs(start - startRenderIndex) > 5 || start < 5) {
      this.setState({ startRenderIndex: start });
    }
    if (Math.abs(end - endRenderIndex) > 5 || end > recordsCount - 5) {
      this.setState({ endRenderIndex: end });
    }
    // Scroll to the bottom of the page, load more records
    if (offsetHeight + contentScrollTop >= this.resultContentRef.scrollHeight) {
      if (this.props.scrollToLoadMore) {
        this.props.scrollToLoadMore();
      }
    }

    if (!this.isScrollingRightScrollbar) {
      this.setRightScrollbarScrollTop(this.oldScrollTop);
    }

    // solve the bug that the scroll bar disappears when scrolling too fast
    this.clearScrollbarTimer();
    this.scrollbarTimer = setTimeout(() => {
      this.setState({ isScrollingRightScrollbar: false });
    }, 300);
  };

  onScrollbarScroll = (scrollTop) => {
    // solve canvas&rightScrollbar circle scroll problem
    if (this.oldScrollTop === scrollTop) {
      return;
    }
    this.setState({ isScrollingRightScrollbar: true }, () => {
      this.setScrollTop(scrollTop);
    });
  };

  onScrollbarMouseUp = () => {
    this.setState({ isScrollingRightScrollbar: false });
  };

  setRightScrollbarScrollTop = (scrollTop) => {
    this.rightScrollbar && this.rightScrollbar.setScrollTop(scrollTop);
  };

  selectNoneCells = () => {
    this.interactionMask && this.interactionMask.selectNone();
    const { selectedPosition } = this.state;
    if (!selectedPosition || selectedPosition.idx < 0 || selectedPosition.rowIdx < 0) {
      return;
    }
    this.selectNone();
  };

  selectNone = () => {
    this.setState({ selectedPosition: { idx: -1, rowIdx: -1 } });
  };

  selectCell = (cell, openEditor) => {
    this.eventBus.dispatch(EVENT_BUS_TYPE.SELECT_CELL, cell, openEditor);
  };

  selectStart = (cellPosition) => {
    this.eventBus.dispatch(EVENT_BUS_TYPE.SELECT_START, cellPosition);
  };

  selectUpdate = (cellPosition, isFromKeyboard, callback) => {
    this.eventBus.dispatch(EVENT_BUS_TYPE.SELECT_UPDATE, cellPosition, isFromKeyboard, callback);
  };

  selectEnd = () => {
    this.eventBus.dispatch(EVENT_BUS_TYPE.SELECT_END);
  };

  onCellClick = (cell, e) => {
    const { selectedPosition } = this.state;
    if (isShiftKeyDown(e)) {
      if (!selectedPosition || selectedPosition.idx === -1) {
        // need select cell first
        this.selectCell(cell, false);
        return;
      }
      const isFromKeyboard = true;
      this.selectUpdate(cell, isFromKeyboard);
    } else {
      const { columns, recordGetterByIndex, checkCanModifyRecord } = this.props;
      const column = getColumnByIndex(cell.idx, columns);
      const supportOpenEditor = checkIsColumnSupportDirectEdit(column);
      const hasOpenPermission = checkIsCellSupportOpenEditor(cell, column, false, recordGetterByIndex, checkCanModifyRecord);
      this.selectCell(cell, supportOpenEditor && hasOpenPermission);
    }
    this.props.onCellClick(cell);
    this.setState({ selectedPosition: cell });
  };

  onCellDoubleClick = (cell, e) => {
    const { columns, recordGetterByIndex, checkCanModifyRecord } = this.props;
    const column = getColumnByIndex(cell.idx, columns);
    const supportOpenEditor = checkEditableViaClickCell(column);
    const hasOpenPermission = checkIsCellSupportOpenEditor(cell, column, false, recordGetterByIndex, checkCanModifyRecord);
    this.selectCell(cell, supportOpenEditor && hasOpenPermission);
  };

  // onRangeSelectStart
  onCellMouseDown = (cellPosition, event) => {
    if (!isShiftKeyDown(event)) {
      this.selectCell(cellPosition);
      this.selectStart(cellPosition);
      window.addEventListener('mouseup', this.onWindowMouseUp);
    }
  };

  // onRangeSelectUpdate
  onCellMouseEnter = (cellPosition) => {
    this.selectUpdate(cellPosition, false, this.updateViewableArea);
  };

  onCellMouseMove = (cellPosition) => {
    this.selectUpdate(cellPosition, false, this.updateViewableArea);
  };

  onWindowMouseUp = (event) => {
    window.removeEventListener('mouseup', this.onWindowMouseUp);
    if (isShiftKeyDown(event)) return;
    this.selectEnd();
    this.clearHorizontalScroll();
  };

  onCellRangeSelectionUpdated = (selectedRange) => {
    this.props.onCellRangeSelectionUpdated(selectedRange);
  };

  onCellContextMenu = (cellPosition) => {
    this.setState({
      selectedPosition: Object.assign({}, this.state.selectedPosition, cellPosition),
    });
    this.props.onCellContextMenu(cellPosition);
  };

  /**
   * When updating the selection by moving the mouse, you need to automatically scroll to expand the visible area
   * @param {object} selectedRange
   */
  updateViewableArea = (selectedRange) => {
    const { sequenceColumnWidth } = this.props;
    const { mousePosition } = selectedRange.cursorCell;
    const { x: mouseX, y: mouseY } = mousePosition;
    const tableHeaderHeight = 50 + 48 + 32;
    const interval = 100;
    const step = 8;

    // cursor is at right boundary
    if (mouseX + interval > window.innerWidth) {
      this.scrollToRight();
    } else if (mouseX - interval < sequenceColumnWidth + this.props.frozenColumnsWidth) {
      // cursor is at left boundary
      this.scrollToLeft();
    } else if (mouseY + interval > window.innerHeight - tableHeaderHeight) {
      // cursor is at bottom boundary
      const scrollTop = this.getScrollTop();
      this.resultContentRef.scrollTop = scrollTop + step;
      this.clearHorizontalScroll();
    } else if (mouseY - interval < tableHeaderHeight) {
      // cursor is at top boundary
      const scrollTop = this.getScrollTop();
      if (scrollTop - 16 >= 0) {
        this.resultContentRef.scrollTop = scrollTop - step;
      }
      this.clearHorizontalScroll();
    } else {
      // cursor is at middle area
      this.clearHorizontalScroll();
    }
  };

  scrollToRight = () => {
    if (this.timer) return;
    this.timer = setInterval(() => {
      const scrollLeft = this.props.getScrollLeft();
      this.props.setRecordsScrollLeft(scrollLeft + 20);
    }, 10);
  };

  scrollToLeft = () => {
    if (this.timer) return;
    this.timer = setInterval(() => {
      const scrollLeft = this.props.getScrollLeft();
      if (scrollLeft <= 0) {
        this.clearHorizontalScroll();
        return;
      }
      this.props.setRecordsScrollLeft(scrollLeft - 20);
    }, 10);
  };

  clearHorizontalScroll = () => {
    if (!this.timer) return;
    clearInterval(this.timer);
    this.timer = null;
  };

  clearScrollbarTimer = () => {
    if (!this.scrollbarTimer) return;
    clearTimeout(this.scrollbarTimer);
    this.scrollbarTimer = null;
  };

  getCellMetaData = () => {
    if (!this.cellMetaData) {
      this.cellMetaData = {
        CellOperationBtn: this.props.CellOperationBtn,
        onCellClick: this.onCellClick,
        onCellDoubleClick: this.onCellDoubleClick,
        onCellMouseDown: this.onCellMouseDown,
        onCellMouseEnter: this.onCellMouseEnter,
        onCellMouseMove: this.onCellMouseMove,
        onDragEnter: this.handleDragEnter,
        modifyRecord: this.props.modifyRecord,
        onCellContextMenu: this.onCellContextMenu,
      };
    }
    return this.cellMetaData;
  };

  handleDragEnter = ({ overRecordIdx, overGroupRecordIndex }) => {
    this.eventBus.dispatch(EVENT_BUS_TYPE.DRAG_ENTER, { overRecordIdx, overGroupRecordIndex });
  };

  setRightScrollbar = (ref) => {
    this.rightScrollbar = ref;
  };

  setInteractionMaskRef = (ref) => {
    this.interactionMask = ref;
  };

  setResultRef = (ref) => {
    this.resultRef = ref;
  };

  getRecordsWrapperScrollHeight = () => {
    return (this.resultRef && this.resultRef.scrollHeight) || 0;
  };

  setResultContentRef = (ref) => {
    this.resultContentRef = ref;
  };

  getCanvasClientHeight = () => {
    return (this.resultContentRef && this.resultContentRef.clientHeight) || 0;
  };

  renderRecords = () => {
    this.recordFrozenRefs = [];
    const {
      recordsCount, columns, sequenceColumnWidth, colOverScanStartIdx, colOverScanEndIdx, lastFrozenColumnKey,
      recordMetrics, showSequenceColumn, showCellColoring, columnColors,
    } = this.props;
    const { startRenderIndex, endRenderIndex, selectedPosition } = this.state;
    const cellMetaData = this.getCellMetaData();
    const lastRecordIndex = recordsCount - 1;
    const shownRecordIds = this.getShownRecordIds();
    const scrollLeft = this.props.getScrollLeft();
    const rowHeight = this.getRowHeight();
    let shownRecords = shownRecordIds.map((recordId, index) => {
      const record = this.props.recordGetterById(recordId);
      const isSelected = RecordMetrics.isRecordSelected(recordId, recordMetrics);
      const recordIndex = startRenderIndex + index;
      const isLastRecord = lastRecordIndex === recordIndex;
      const hasSelectedCell = this.props.hasSelectedCell({ recordIndex }, selectedPosition);
      const columnColor = showCellColoring ? columnColors[recordId] : {};
      return (
        <Record
          key={recordId || recordIndex}
          ref={ref => {
            this.recordFrozenRefs.push(ref);
          }}
          isSelected={isSelected}
          index={recordIndex}
          isLastRecord={isLastRecord}
          showSequenceColumn={showSequenceColumn}
          record={record}
          columns={columns}
          sequenceColumnWidth={sequenceColumnWidth}
          colOverScanStartIdx={colOverScanStartIdx}
          colOverScanEndIdx={colOverScanEndIdx}
          lastFrozenColumnKey={lastFrozenColumnKey}
          scrollLeft={scrollLeft}
          height={rowHeight}
          cellMetaData={cellMetaData}
          columnColor={columnColor}
          searchResult={this.props.searchResult}
          checkCanModifyRecord={this.props.checkCanModifyRecord}
          checkCellValueChanged={this.props.checkCellValueChanged}
          hasSelectedCell={hasSelectedCell}
          selectedPosition={this.state.selectedPosition}
          selectNoneCells={this.selectNoneCells}
          onSelectRecord={this.props.onSelectRecord}
        />
      );
    });

    const upperHeight = startRenderIndex * ROW_HEIGHT;
    const belowHeight = (recordsCount - endRenderIndex) * ROW_HEIGHT;

    // add top placeholder
    if (upperHeight > 0) {
      const style = { height: upperHeight, width: '100%' };
      const upperRow = <div key="upper-placeholder" className="d-flex align-items-end" style={style}><Loading /></div>;
      shownRecords.unshift(upperRow);
    }

    // add bottom placeholder
    if (belowHeight > 0) {
      const style = { height: belowHeight, width: '100%' };
      const belowRow = <div key="below-placeholder" style={style}><Loading /></div>;
      shownRecords.push(belowRow);
    }
    return shownRecords;
  };

  render() {
    return (
      <Fragment>
        <div
          id="canvas"
          className="sf-table-canvas"
          ref={this.setResultContentRef}
          onScroll={this.onScroll}
          onKeyDown={this.props.onGridKeyDown}
          onKeyUp={this.props.onGridKeyUp}
        >
          <InteractionMasks
            {...this.props}
            ref={this.setInteractionMaskRef}
            contextMenu={this.props.contextMenu}
            canAddRow={this.props.canAddRow}
            tableId={this.props.tableId}
            columns={this.props.columns}
            recordsCount={this.props.recordsCount}
            recordMetrics={this.props.recordMetrics}
            rowHeight={this.getRowHeight()}
            getRowTop={this.getRowTop}
            scrollTop={this.oldScrollTop}
            getScrollLeft={this.props.getScrollLeft}
            getTableContentRect={this.props.getTableContentRect}
            getMobileFloatIconStyle={this.props.getMobileFloatIconStyle}
            onToggleMobileMoreOperations={this.props.onToggleMobileMoreOperations}
            editorPortalTarget={this.props.editorPortalTarget}
            onCellRangeSelectionUpdated={this.onCellRangeSelectionUpdated}
            recordGetterByIndex={this.props.recordGetterByIndex}
            recordGetterById={this.props.recordGetterById}
            editMobileCell={this.props.editMobileCell}
            frozenColumnsWidth={this.props.frozenColumnsWidth}
            selectNone={this.selectNone}
            getVisibleIndex={this.getVisibleIndex}
            onHitBottomBoundary={this.onHitBottomCanvas}
            onHitTopBoundary={this.onHitTopCanvas}
            onCellClick={this.onCellClick}
            scrollToColumn={this.scrollToColumn}
            setRecordsScrollLeft={this.props.setRecordsScrollLeft}
            getUpdateDraggedRecords={this.props.getUpdateDraggedRecords}
            getCopiedRecordsAndColumnsFromRange={this.props.getCopiedRecordsAndColumnsFromRange}
            getTableCanvasContainerRect={this.props.getTableCanvasContainerRect}
          />
          <div className="sf-table-records-wrapper" style={{ width: this.props.totalWidth + this.props.sequenceColumnWidth }} ref={this.setResultRef}>
            {this.renderRecords()}
          </div>
        </div>
        <RightScrollbar
          ref={this.setRightScrollbar}
          getClientHeight={this.getCanvasClientHeight}
          getScrollHeight={this.getRecordsWrapperScrollHeight}
          onScrollbarScroll={this.onScrollbarScroll}
          onScrollbarMouseUp={this.onScrollbarMouseUp}
        />
      </Fragment>
    );
  }
}

RecordsBody.propTypes = {
  onRef: PropTypes.func,
  contextMenu: PropTypes.oneOfType([PropTypes.node, PropTypes.element]),
  canAddRow: PropTypes.bool,
  tableId: PropTypes.string,
  recordIds: PropTypes.array,
  recordsCount: PropTypes.number,
  columns: PropTypes.array.isRequired,
  CellOperationBtn: PropTypes.object,
  colOverScanStartIdx: PropTypes.number,
  colOverScanEndIdx: PropTypes.number,
  lastFrozenColumnKey: PropTypes.string,
  showSequenceColumn: PropTypes.bool,
  sequenceColumnWidth: PropTypes.number,
  hasSelectedRecord: PropTypes.bool,
  recordMetrics: PropTypes.object,
  totalWidth: PropTypes.number,
  getColumnVisibleEnd: PropTypes.func,
  getScrollLeft: PropTypes.func,
  setRecordsScrollLeft: PropTypes.func,
  storeScrollPosition: PropTypes.func,
  hasSelectedCell: PropTypes.func,
  scrollToLoadMore: PropTypes.func,
  getTableContentRect: PropTypes.func,
  getMobileFloatIconStyle: PropTypes.func,
  onToggleMobileMoreOperations: PropTypes.func,
  onToggleInsertRecordDialog: PropTypes.func,
  editorPortalTarget: PropTypes.instanceOf(Element),
  recordGetterByIndex: PropTypes.func,
  recordGetterById: PropTypes.func,
  modifyRecord: PropTypes.func,
  selectNone: PropTypes.func,
  onCellClick: PropTypes.func,
  onCellRangeSelectionUpdated: PropTypes.func,
  onSelectRecord: PropTypes.func,
  checkCanModifyRecord: PropTypes.func,
  deleteRecordsLinks: PropTypes.func,
  paste: PropTypes.func,
  searchResult: PropTypes.object,
  scrollToRowIndex: PropTypes.number,
  frozenColumnsWidth: PropTypes.number,
  editMobileCell: PropTypes.func,
  reloadRecords: PropTypes.func,
  appPage: PropTypes.object,
  showCellColoring: PropTypes.bool,
  columnColors: PropTypes.object,
  onFillingDragRows: PropTypes.func,
  getUpdateDraggedRecords: PropTypes.func,
  getCopiedRecordsAndColumnsFromRange: PropTypes.func,
  openDownloadFilesDialog: PropTypes.func,
  cacheDownloadFilesProps: PropTypes.func,
  onCellContextMenu: PropTypes.func,
  getTableCanvasContainerRect: PropTypes.func,
};

export default RecordsBody;
