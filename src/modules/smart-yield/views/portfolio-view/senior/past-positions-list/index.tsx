import React from 'react';
import AntdEmpty from 'antd/lib/empty';
import AntdSpin from 'antd/lib/spin';
import BigNumber from 'bignumber.js';
import { formatBigValue } from 'web3/utils';

import Card from 'components/antd/card';
import Divider from 'components/antd/divider';
import IconBubble from 'components/custom/icon-bubble';
import StatusTag from 'components/custom/status-tag';
import { Text } from 'components/custom/typography';
import { mergeState } from 'hooks/useMergeState';
import {
  APISYPool,
  APISYSeniorRedeem,
  Markets,
  Pools,
  SYMarketMeta,
  SYPoolMeta,
  fetchSYSeniorRedeems,
} from 'modules/smart-yield/api';
import { usePools } from 'modules/smart-yield/providers/pools-provider';
import { useWallet } from 'wallets/wallet';

import s from './s.module.scss';

type ListEntity = APISYSeniorRedeem & {
  pool?: APISYPool & {
    meta?: SYPoolMeta;
    market?: SYMarketMeta;
  };
};

type State = {
  loading: boolean;
  data: ListEntity[];
  total: number;
  pageSize: number;
  page: number;
};

const InitialState: State = {
  loading: false,
  data: [],
  total: 0,
  pageSize: 10,
  page: 1,
};

type Props = {
  originatorFilter?: string;
  tokenFilter?: string;
};

const PastPositionsList: React.FC<Props> = props => {
  const { originatorFilter = 'all', tokenFilter = 'all' } = props;

  const wallet = useWallet();
  const poolsCtx = usePools();

  const { pools } = poolsCtx;

  const [state, setState] = React.useState<State>(InitialState);

  React.useEffect(() => {
    if (!pools || pools.length === 0) {
      return;
    }

    (async () => {
      if (!wallet.account) {
        return;
      }

      setState(
        mergeState<State>({
          loading: true,
        }),
      );

      try {
        const redeems = await fetchSYSeniorRedeems(
          wallet.account,
          state.page,
          state.pageSize,
          originatorFilter,
          tokenFilter,
        );

        const data = redeems.data.map(item => {
          const pool = pools.find(poolItem => poolItem.smartYieldAddress === item.smartYieldAddress);

          return {
            ...item,
            pool: pool
              ? {
                  ...pool,
                  meta: Pools.get(pool.underlyingSymbol),
                  market: Markets.get(pool.protocolId),
                }
              : undefined,
          };
        });

        setState(
          mergeState<State>({
            loading: false,
            data,
            total: redeems.meta.count,
          }),
        );
      } catch {
        setState(
          mergeState<State>({
            loading: false,
            data: [],
            total: 0,
          }),
        );
      }
    })();
  }, [wallet.account, state.page, originatorFilter, tokenFilter, pools]);

  return (
    <>
      <AntdSpin spinning={state.loading}>
        {state.data.length === 0 && !state.loading && <AntdEmpty image={AntdEmpty.PRESENTED_IMAGE_SIMPLE} />}
        <div className={s.cards}>
          {state.data.map(entity => (
            <Card key={entity.seniorBondId} noPaddingBody>
              <div className="flex p-24">
                <IconBubble name={entity.pool?.meta?.icon} bubbleName={entity.pool?.market?.icon} className="mr-16" />
                <div>
                  <Text type="p1" weight="semibold" color="primary" className="mb-4">
                    {entity.pool?.underlyingSymbol}
                  </Text>
                  <Text type="small" weight="semibold">
                    {entity.pool?.market?.name}
                  </Text>
                </div>

                <StatusTag text="REDEEMED" color="blue" className="ml-auto" />
              </div>
              <Divider />
              <div className="p-24">
                <Text type="small" weight="semibold" color="secondary">
                  Deposited
                </Text>
                <Text type="p1" weight="semibold" color="primary">
                  {formatBigValue(entity.underlyingIn)}
                </Text>
              </div>
              <Divider />
              <div className="p-24">
                <Text type="small" weight="semibold" color="secondary">
                  Redeemed
                </Text>
                <Text type="p1" weight="semibold" color="primary">
                  {formatBigValue(entity.gain)}
                </Text>
              </div>
              <Divider />
              <div className="p-24">
                <Text type="small" weight="semibold" color="secondary">
                  APY
                </Text>
                <Text type="p1" weight="semibold" color="green">
                  {formatBigValue(
                    new BigNumber(entity.gain)
                      .dividedBy(entity.underlyingIn)
                      .dividedBy(entity.forDays)
                      .multipliedBy(365)
                      .multipliedBy(100),
                  )}{' '}
                  %
                </Text>
              </div>
            </Card>
          ))}
        </div>
      </AntdSpin>
    </>
  );
};

export default PastPositionsList;
