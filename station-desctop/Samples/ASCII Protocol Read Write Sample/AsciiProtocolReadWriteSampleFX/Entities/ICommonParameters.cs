//-----------------------------------------------------------------------
// <copyright file="ICommonParameters.cs" company="Technology Solutions UK Ltd"> 
//     Copyright (c) 2013 Technology Solutions UK Ltd. All rights reserved. 
// </copyright> 
// <author>Robin Stone</author>
//-----------------------------------------------------------------------
namespace TechnologySolutions.AsciiProtocolSample.Entities
{
    using System;
    using System.Collections.Generic;
    using System.ComponentModel;
    using System.Linq;
    using System.Text;

    using TechnologySolutions.Rfid.AsciiProtocol;
    using TechnologySolutions.Rfid.AsciiProtocol.Parameters;

    /// <summary>
    /// Provides access to the parameters that are common to a number of commands
    /// </summary>
    public interface ICommonParameters
        : ITransponderParameters, IAntennaParameters, IResponseParameters, INotifyPropertyChanged
    {
    }
}
