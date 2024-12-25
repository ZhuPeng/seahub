import { CellType } from '../column';
import { FILTER_TERM_MODIFIER_TYPE } from './filter-modifier';
import { FILTER_PREDICATE_TYPE } from './filter-predicate';

const textPredicates = [
  FILTER_PREDICATE_TYPE.CONTAINS,
  FILTER_PREDICATE_TYPE.NOT_CONTAIN,
  FILTER_PREDICATE_TYPE.IS,
  FILTER_PREDICATE_TYPE.IS_NOT,
  FILTER_PREDICATE_TYPE.EMPTY,
  FILTER_PREDICATE_TYPE.NOT_EMPTY,
  FILTER_PREDICATE_TYPE.IS_CURRENT_USER_ID,
];

const numberPredicates = [
  FILTER_PREDICATE_TYPE.EQUAL,
  FILTER_PREDICATE_TYPE.NOT_EQUAL,
  FILTER_PREDICATE_TYPE.LESS,
  FILTER_PREDICATE_TYPE.GREATER,
  FILTER_PREDICATE_TYPE.LESS_OR_EQUAL,
  FILTER_PREDICATE_TYPE.GREATER_OR_EQUAL,
  FILTER_PREDICATE_TYPE.EMPTY,
  FILTER_PREDICATE_TYPE.NOT_EMPTY,
];

const datePredicates = [
  FILTER_PREDICATE_TYPE.IS,
  FILTER_PREDICATE_TYPE.IS_WITHIN,
  FILTER_PREDICATE_TYPE.IS_BEFORE,
  FILTER_PREDICATE_TYPE.IS_AFTER,
  FILTER_PREDICATE_TYPE.IS_ON_OR_BEFORE,
  FILTER_PREDICATE_TYPE.IS_ON_OR_AFTER,
  FILTER_PREDICATE_TYPE.IS_NOT,
  FILTER_PREDICATE_TYPE.EMPTY,
  FILTER_PREDICATE_TYPE.NOT_EMPTY,
];

const dateTermModifiers = [
  FILTER_TERM_MODIFIER_TYPE.TODAY,
  FILTER_TERM_MODIFIER_TYPE.TOMORROW,
  FILTER_TERM_MODIFIER_TYPE.YESTERDAY,
  FILTER_TERM_MODIFIER_TYPE.ONE_WEEK_AGO,
  FILTER_TERM_MODIFIER_TYPE.ONE_WEEK_FROM_NOW,
  FILTER_TERM_MODIFIER_TYPE.ONE_MONTH_AGO,
  FILTER_TERM_MODIFIER_TYPE.ONE_MONTH_FROM_NOW,
  FILTER_TERM_MODIFIER_TYPE.NUMBER_OF_DAYS_AGO,
  FILTER_TERM_MODIFIER_TYPE.NUMBER_OF_DAYS_FROM_NOW,
  FILTER_TERM_MODIFIER_TYPE.EXACT_DATE,
];

const FILTER_COLUMN_OPTIONS = {
  [CellType.TEXT]: {
    filterPredicateList: textPredicates,
  },
  [CellType.NUMBER]: {
    filterPredicateList: numberPredicates,
  },
  [CellType.FILE_NAME]: {
    filterPredicateList: textPredicates,
  },
  [CellType.DATE]: {
    filterPredicateList: datePredicates,
    filterTermModifierList: dateTermModifiers,
  },
  [CellType.SINGLE_SELECT]: {
    filterPredicateList: [
      FILTER_PREDICATE_TYPE.IS,
      FILTER_PREDICATE_TYPE.IS_NOT,
      FILTER_PREDICATE_TYPE.IS_ANY_OF,
      FILTER_PREDICATE_TYPE.IS_NONE_OF,
      FILTER_PREDICATE_TYPE.EMPTY,
      FILTER_PREDICATE_TYPE.NOT_EMPTY,
    ],
  },
  [CellType.MULTIPLE_SELECT]: {
    filterPredicateList: [
      FILTER_PREDICATE_TYPE.HAS_ANY_OF,
      FILTER_PREDICATE_TYPE.HAS_ALL_OF,
      FILTER_PREDICATE_TYPE.HAS_NONE_OF,
      FILTER_PREDICATE_TYPE.IS_EXACTLY,
      FILTER_PREDICATE_TYPE.EMPTY,
      FILTER_PREDICATE_TYPE.NOT_EMPTY,
    ],
  },
  [CellType.CTIME]: {
    filterPredicateList: datePredicates,
    filterTermModifierList: dateTermModifiers,
  },
  [CellType.MTIME]: {
    filterPredicateList: datePredicates,
    filterTermModifierList: dateTermModifiers,
  },
  [CellType.CREATOR]: {
    filterPredicateList: [
      FILTER_PREDICATE_TYPE.CONTAINS,
      FILTER_PREDICATE_TYPE.NOT_CONTAIN,
      FILTER_PREDICATE_TYPE.INCLUDE_ME,
      FILTER_PREDICATE_TYPE.IS,
      FILTER_PREDICATE_TYPE.IS_NOT,
    ],
  },
  [CellType.LAST_MODIFIER]: {
    filterPredicateList: [
      FILTER_PREDICATE_TYPE.CONTAINS,
      FILTER_PREDICATE_TYPE.NOT_CONTAIN,
      FILTER_PREDICATE_TYPE.INCLUDE_ME,
      FILTER_PREDICATE_TYPE.IS,
      FILTER_PREDICATE_TYPE.IS_NOT,
    ],
  },
  [CellType.CHECKBOX]: {
    filterPredicateList: [
      FILTER_PREDICATE_TYPE.IS,
    ],
  },
  [CellType.URL]: {
    filterPredicateList: [
      FILTER_PREDICATE_TYPE.CONTAINS,
      FILTER_PREDICATE_TYPE.NOT_CONTAIN,
      FILTER_PREDICATE_TYPE.IS,
      FILTER_PREDICATE_TYPE.IS_NOT,
      FILTER_PREDICATE_TYPE.EMPTY,
      FILTER_PREDICATE_TYPE.NOT_EMPTY,
    ],
  },
  [CellType.COLLABORATOR]: {
    filterPredicateList: [
      FILTER_PREDICATE_TYPE.HAS_ANY_OF,
      FILTER_PREDICATE_TYPE.HAS_ALL_OF,
      FILTER_PREDICATE_TYPE.HAS_NONE_OF,
      FILTER_PREDICATE_TYPE.IS_EXACTLY,
      FILTER_PREDICATE_TYPE.EMPTY,
      FILTER_PREDICATE_TYPE.NOT_EMPTY,
      FILTER_PREDICATE_TYPE.INCLUDE_ME,
    ],
  },
  [CellType.LONG_TEXT]: {
    filterPredicateList: [
      FILTER_PREDICATE_TYPE.EMPTY,
      FILTER_PREDICATE_TYPE.NOT_EMPTY,
    ],
  },
  [CellType.RATE]: {
    filterPredicateList: numberPredicates,
  },
  [CellType.TAGS]: {
    filterPredicateList: textPredicates,
  },
};

export {
  FILTER_COLUMN_OPTIONS,
};
