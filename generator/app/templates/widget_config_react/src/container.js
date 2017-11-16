import React from "react";
import { Button, Form } from 'antd';
import EnhancerTimeline from './components/timeline';

class Container extends React.Component {

  static propTypes = {
  }
  static defaultProps = {
    dataSourceId: React.PropTypes.number
  }

  constructor(props) {
    super();
    this.state = {
      dataSourceId: props.dataSourceId
    }
  }

  componentDidMount() {
  }

  handleDirection = (value)=> {
    this.setState({
      direction: value,
    });
  }


  addDataSource = () => {
    const self = this;
    Enhancer.DatasourceManager.editDatasource({id: this.state.dataSourceId, callback: function (source) {
      self.setState({
        dataSourceId: source.id
      });
    }});
  }
  

  render() {

    return (
        <div style={{display: "flex"}}  className="config-container">
          <div style={{
            flex: 1,
            padding: '10px 20px'
          }}>
            <EnhancerTimeline {...this.state} />
          </div>
          <div style={{
            width: 180
          }}>
            <Form layout="inline">
              <FormItem
                label="展示方向"
              >
                <Select defaultValue="vertical" onChange={this.handleDirection}>
                  <Option value="vertical">垂直</Option>
                  <Option value="horizontal">水平</Option>
                </Select>
              </FormItem>
            </Form>

            <Button type="primary" onClick={this.addDataSource} >
              添加数据源
            </Button>
          </div>
      </div>
    );
  }
}



export default Container;
