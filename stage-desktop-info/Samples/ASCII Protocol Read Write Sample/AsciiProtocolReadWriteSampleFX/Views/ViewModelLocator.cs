
namespace TechnologySolutions.AsciiProtocolSample.Views
{
    using System;
    using System.Collections.Generic;
    using System.Linq;
    using System.Reflection;
    using System.Text;

    public static class ViewModelLocator
    {
        public static TViewModel ViewModel<TViewModel>()
        {
            return (TViewModel)TechnologySolutions.ModelViewViewModel.ServiceProvider.Current.GetService(typeof(TViewModel));
        }
    }
}
