import React, { useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { CustomizeSelect, Icon, FileTagsFormatter } from '@seafile/sf-metadata-ui-component';
import { gettext } from '../../../../../utils/constants';
import { useMetadataStatus } from '../../../../../hooks';
import { useTags } from '../../../../../tag/hooks';
import { getTagId, getTagName, getTagColor } from '../../../../../tag/utils/cell';
import { getRowById } from '../../../../utils/table';

const TagsFilter = ({ readOnly, value: oldValue, onChange: onChangeAPI }) => {

  const { tagsData } = useTags();
  const { enableTags } = useMetadataStatus();

  const value = useMemo(() => {
    if (!enableTags) return [];
    if (!tagsData) return [];
    if (!Array.isArray(oldValue) || oldValue.length === 0) return [];
    return oldValue.filter(tagId => getRowById(tagsData, tagId));
  }, [oldValue, tagsData, enableTags]);

  const options = useMemo(() => {
    if (!tagsData) return [];
    const tags = tagsData?.rows || [];
    if (tags.length === 0) return [];
    return tags.map(tag => {
      const tagId = getTagId(tag);
      const tagName = getTagName(tag);
      const tagColor = getTagColor(tag);
      const isSelected = Array.isArray(value) ? value.includes(tagId) : false;
      return {
        name: tagName,
        value: tagId,
        label: (
          <div className="select-basic-filter-option">
            <div className="sf-metadata-tag-color-and-name">
              <div className="sf-metadata-tag-color" style={{ backgroundColor: tagColor }}></div>
              <div className="sf-metadata-tag-name">{tagName}</div>
            </div>
            <div className="select-basic-filter-option-check-icon">
              {isSelected && (<Icon iconName="check-mark" />)}
            </div>
          </div>
        )
      };
    });
  }, [value, tagsData]);

  const displayValue = useMemo(() => {
    const emptyTip = {
      label: (
        <div className="select-basic-filter-display-name">
          {gettext('Tags')}
        </div>
      ),
    };
    if (!tagsData) return emptyTip;
    const tags = tagsData?.rows || [];
    if (tags.length === 0) emptyTip;
    if (!Array.isArray(value) || value.length === 0) return emptyTip;
    const selectedTags = value.map(tagId => getRowById(tagsData, tagId)).filter(item => item).map(tag => ({ row_id: getTagId(tag) }));
    if (selectedTags.length === 0) return emptyTip;
    return {
      label: (
        <div className="select-basic-filter-display-name">
          <FileTagsFormatter className="sf-metadata-basic-tags-filter-formatter pr-2" tagsData={tagsData} value={selectedTags} />
        </div>
      )
    };
  }, [value, tagsData]);

  const onChange = useCallback((newValue) => {
    if (value.includes(newValue)) {
      onChangeAPI(value.filter(v => v !== newValue));
    } else {
      onChangeAPI([...value, newValue]);
    }
  }, [value, onChangeAPI]);

  if (!enableTags) return null;

  return (
    <CustomizeSelect
      readOnly={readOnly}
      searchable={true}
      supportMultipleSelect={true}
      className="sf-metadata-basic-filters-select sf-metadata-table-view-basic-filter-file-type-select mr-4"
      value={displayValue}
      options={options}
      onSelectOption={onChange}
      searchPlaceholder={gettext('Search tag')}
      noOptionsPlaceholder={gettext('No tags')}
      component={{
        DropDownIcon: (
          <i className="sf3-font sf3-font-down"></i>
        )
      }}
    />
  );

};

TagsFilter.propTypes = {
  readOnly: PropTypes.bool,
  value: PropTypes.array,
  onChange: PropTypes.func,
};

export default TagsFilter;
