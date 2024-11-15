import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalBody, ModalFooter, ModalHeader, Button } from 'reactstrap';
import { gettext } from '../../../utils/constants';

const propTypes = {
  node: PropTypes.object,
  toggle: PropTypes.func,
  onDelete: PropTypes.func
};

class DeleteDepartmentV2ConfirmDialog extends React.Component {
  render() {
    const { node, toggle } = this.props;
    return (
      <Modal isOpen={true} toggle={toggle}>
        <ModalHeader toggle={toggle}>
          {gettext('Delete department')}
        </ModalHeader>
        <ModalBody>
          <p>{gettext('Are you sure to delete')}{' '}<b>{node.name}</b> ?</p>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onMouseDown={toggle}>{gettext('Cancel')}</Button>
          <Button color="primary" onMouseDown={this.props.onDelete}>{gettext('Delete')}</Button>
        </ModalFooter>
      </Modal>
    );
  }
}

DeleteDepartmentV2ConfirmDialog.propTypes = propTypes;

export default DeleteDepartmentV2ConfirmDialog;
